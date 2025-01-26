import { createHttpClient, HttpClient } from '../utils/http-client.js';
import {
  createDnsResolver,
  DnsResolver,
} from '../utils/dns-resolver.js';
import { CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { createSpinner } from '../utils/spinner.js';
import { SubdomainVerificationResult } from '../types';
import pMap from 'p-map';
import pRetry from 'p-retry';
import chalk from 'chalk';

/**
 * Fetches subdomains from crt.sh certificate transparency logs.
 */
async function fetchFromCrtSh(
  http: HttpClient,
  domain: string,
): Promise<string[]> {
  const url = `${CONFIG.API_ENDPOINTS.CRTSH}/?q=%.${domain}&output=json`;

  const response = await pRetry(() => http.get(url), {
    retries: CONFIG.DEFAULT_RETRIES,
    minTimeout: 1000,
    maxTimeout: 3000,
  });

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  const rawSubdomains = response.data
    .map((entry: { name_value: string }) =>
      entry.name_value.toLowerCase(),
    )
    .filter((subdomain: string) => subdomain.endsWith(domain));

  return [...new Set(rawSubdomains)];
}

/**
 * Fetches subdomains from Rapid7's Project Sonar dataset.
 */
async function fetchFromRapid7(
  http: HttpClient,
  domain: string,
): Promise<string[]> {
  const url = `${CONFIG.API_ENDPOINTS.RAPID7}/subdomains/${domain}`;

  const response = await pRetry(() => http.get(url), {
    retries: CONFIG.DEFAULT_RETRIES,
    minTimeout: 1000,
    maxTimeout: 3000,
  });

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  const rawSubdomains = response.data
    .map((subdomain: string) => subdomain.toLowerCase())
    .filter((subdomain: string) => subdomain.endsWith(domain));

  return [...new Set(rawSubdomains)];
}

/**
 * Attempts DNS resolution and HTTP HEAD check to verify if a subdomain is alive.
 */
async function verifySubdomain(
  subdomain: string,
  source: SubdomainVerificationResult['source'],
  http: HttpClient,
  dnsResolver: DnsResolver,
): Promise<SubdomainVerificationResult> {
  const spinner = createSpinner(
    `Resolving and verifying ${subdomain}...`,
  );
  spinner.start();

  try {
    // DNS resolution
    const resolvedIps = await dnsResolver.resolve(subdomain);
    spinner.text = chalk.cyan(
      `Resolved ${subdomain} => ${resolvedIps.join(', ')}`,
    );

    // HTTP check (try HTTPS first, then HTTP)
    let isAlive = false;
    await pRetry(
      async () => {
        try {
          await http.head(`https://${subdomain}`);
          isAlive = true;
        } catch {
          await http.head(`http://${subdomain}`);
          isAlive = true;
        }
      },
      {
        retries: 1,
        minTimeout: 500,
        maxTimeout: 2000,
      },
    ).catch(() => {
      // not responding on either port
      isAlive = false;
    });

    spinner.succeed(
      chalk.green(`Verified ${subdomain} => Alive: ${isAlive}`),
    );
    return { subdomain, isAlive, resolvedIps, source };
  } catch (error) {
    spinner.fail(chalk.red(`Failed verification for ${subdomain}`));
    logger.debug(
      `Subdomain verification error: ${(error as Error).message}`,
    );
    return {
      subdomain,
      isAlive: false,
      resolvedIps: [],
      source,
      error: (error as Error).message,
    };
  }
}

/**
 * Orchestrates subdomain scanning from multiple data sources, then verifies each subdomain concurrently.
 */
export class SubdomainScanner {
  private readonly http: HttpClient;
  private readonly dnsResolver: DnsResolver;
  private readonly concurrency: number;

  /**
   * @param concurrency - Maximum number of concurrent verifications
   */
  constructor(concurrency = CONFIG.DEFAULT_THREADS) {
    this.http = createHttpClient();
    this.dnsResolver = createDnsResolver();
    this.concurrency = concurrency;
  }

  /**
   * Scans the given domain using multiple data sources and verifies each subdomain.
   */
  public async scan(
    domain: string,
  ): Promise<SubdomainVerificationResult[]> {
    logger.info(`Starting subdomain scan for ${domain}`);

    // Fetch subdomains from different data sources
    const spinner = createSpinner('Fetching from crt.sh and Rapid7...');
    spinner.start();

    let crtshSubs: string[] = [];
    let rapid7Subs: string[] = [];
    try {
      [crtshSubs, rapid7Subs] = await Promise.all([
        fetchFromCrtSh(this.http, domain),
        fetchFromRapid7(this.http, domain),
      ]);
      spinner.succeed(
        chalk.green('Successfully fetched subdomain lists.'),
      );
    } catch (error) {
      spinner.fail(
        chalk.red('Failed to fetch from one or more data sources.'),
      );
      logger.error(
        `Data source fetch error: ${(error as Error).message}`,
      );
    }

    // Combine the results
    const combined = new Set([...crtshSubs, ...rapid7Subs]);
    logger.info(`Discovered ${combined.size} unique subdomains total.`);

    // If there’s an optional brute force mechanism
    if (CONFIG.ENABLE_BRUTE_FORCE) {
      logger.warn(
        'Brute force scanning is not yet implemented. Skipping...',
      );
    }

    // Verify each discovered subdomain
    const verifySpinner = createSpinner('Verifying subdomains...');
    verifySpinner.start();

    let verifiedCount = 0;
    const subdomainList = Array.from(combined);
    const results = await pMap(
      subdomainList,
      async (sub) => {
        const source = crtshSubs.includes(sub) ? 'crtsh' : 'rapid7';
        const result = await verifySubdomain(
          sub,
          source,
          this.http,
          this.dnsResolver,
        );
        verifiedCount++;
        verifySpinner.text = chalk.cyan(
          `Verified ${verifiedCount}/${subdomainList.length} subdomains...`,
        );
        return result;
      },
      { concurrency: this.concurrency },
    );

    verifySpinner.succeed(
      chalk.green(`Verification complete for ${domain}.`),
    );
    return results;
  }
}
