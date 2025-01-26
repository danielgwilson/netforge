import { z } from 'zod';
import pMap from 'p-map';
import pRetry from 'p-retry';
import { type Result, ok, err } from 'neverthrow';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import {
  type HttpClient,
  createHttpClient,
} from '../utils/http-client.js';
import {
  type DnsResolver,
  createDnsResolver,
} from '../utils/dns-resolver.js';

// Schema definitions for type safety and validation
const scanOptionsSchema = z.object({
  bruteForce: z.boolean().default(false),
  wordlist: z.string().optional(),
  threads: z.number().int().positive().default(10),
  timeout: z.number().int().positive().default(5000),
  retries: z.number().int().min(0).default(3),
});

export type ScanOptions = z.infer<typeof scanOptionsSchema>;

export interface SubdomainResult {
  subdomain: string;
  isAlive: boolean;
  resolvedIps: string[];
  source: 'crtsh' | 'rapid7' | 'bruteforce';
  error?: string;
}

// Data source configurations
const API_ENDPOINTS = {
  crtsh: 'https://crt.sh',
  rapid7: 'https://sonar.omnisint.io',
} as const;

/**
 * Creates a subdomain scanner with the specified options
 * @param options Scanner configuration options
 * @param deps Optional dependency injections for testing
 * @returns A function that performs subdomain scanning
 */
export const createScanner = (
  options: Partial<ScanOptions>,
  deps?: {
    httpClient?: HttpClient;
    dnsResolver?: DnsResolver;
  },
) => {
  // Validate options
  const validatedOptions = scanOptionsSchema.parse(options);

  // Initialize dependencies
  const httpClient =
    deps?.httpClient ??
    createHttpClient({
      timeout: validatedOptions.timeout,
      retries: validatedOptions.retries,
    });

  const dnsResolver = deps?.dnsResolver ?? createDnsResolver();

  /**
   * Fetches subdomains from Certificate Transparency logs
   */
  const getCrtShResults = async (
    domain: string,
  ): Promise<Result<string[], Error>> => {
    try {
      const response = await pRetry(
        () =>
          httpClient.get(
            `${API_ENDPOINTS.crtsh}/?q=%.${domain}&output=json`,
          ),
        {
          retries: validatedOptions.retries,
          minTimeout: 1000,
          maxTimeout: 3000,
        },
      );

      const subdomains = response.data
        .map((entry: { name_value: string }) =>
          entry.name_value.toLowerCase(),
        )
        .filter((subdomain: string) => subdomain.endsWith(domain))
        .filter(
          (subdomain: string, index: number, self: string[]) =>
            self.indexOf(subdomain) === index,
        );

      return ok(subdomains);
    } catch (error) {
      logger.error('CrtSh fetch failed', { error });
      return err(
        error instanceof Error ? error : new Error('Unknown error'),
      );
    }
  };

  /**
   * Fetches subdomains from Rapid7's dataset
   */
  const getRapid7Results = async (
    domain: string,
  ): Promise<Result<string[], Error>> => {
    try {
      const response = await pRetry(
        () =>
          httpClient.get(
            `${API_ENDPOINTS.rapid7}/subdomains/${domain}`,
          ),
        {
          retries: validatedOptions.retries,
          minTimeout: 1000,
          maxTimeout: 3000,
        },
      );

      const subdomains = response.data
        .map((subdomain: string) => subdomain.toLowerCase())
        .filter((subdomain: string) => subdomain.endsWith(domain));

      return ok(subdomains);
    } catch (error) {
      logger.error('Rapid7 fetch failed', { error });
      return err(
        error instanceof Error ? error : new Error('Unknown error'),
      );
    }
  };

  /**
   * Verifies if a subdomain is alive and resolves its IPs
   */
  const verifySubdomain = async (
    subdomain: string,
    source: SubdomainResult['source'],
  ): Promise<SubdomainResult> => {
    try {
      const dnsSpinner = ora({
        text: chalk.cyan(`Resolving DNS for ${subdomain}...`),
        spinner: 'dots2',
      }).start();

      const resolvedIps = await dnsResolver.resolve(subdomain);
      dnsSpinner.succeed(
        chalk.green(
          `Successfully resolved ${subdomain} to ${resolvedIps.join(', ')}`,
        ),
      );

      // Try HTTP/HTTPS connectivity
      const connectSpinner = ora({
        text: chalk.cyan(`Testing connectivity for ${subdomain}...`),
        spinner: 'dots2',
      }).start();

      const isAlive = await pRetry(
        async () => {
          try {
            await httpClient.head(`https://${subdomain}`);
            connectSpinner.succeed(
              chalk.green(`${subdomain} is alive (HTTPS)`),
            );
            return true;
          } catch {
            await httpClient.head(`http://${subdomain}`);
            connectSpinner.succeed(
              chalk.green(`${subdomain} is alive (HTTP)`),
            );
            return true;
          }
        },
        {
          retries: 1,
          minTimeout: 1000,
          maxTimeout: 3000,
          onFailedAttempt: (error) => {
            connectSpinner.text = chalk.yellow(
              `Connection attempt failed for ${subdomain} (${error.retriesLeft} retries left)`,
            );
          },
        },
      ).catch(() => {
        connectSpinner.fail(
          chalk.red(`${subdomain} is not responding to HTTP(S)`),
        );
        return false;
      });

      return {
        subdomain,
        isAlive,
        resolvedIps,
        source,
      };
    } catch (error) {
      logger.debug(
        chalk.red(
          `Failed to verify ${subdomain}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        ),
      );
      return {
        subdomain,
        isAlive: false,
        resolvedIps: [],
        source,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  /**
   * Main scanning function that orchestrates the subdomain discovery process
   */
  const scan = async (domain: string): Promise<SubdomainResult[]> => {
    logger.info(chalk.blue(`Starting scan for ${domain}`));

    // Collect subdomains from all sources
    const crtshSpinner = ora({
      text: chalk.cyan(
        'Fetching data from certificate transparency logs (crt.sh)...',
      ),
      spinner: 'dots',
    }).start();

    const crtshResult = await getCrtShResults(domain);

    if (crtshResult.isOk()) {
      const count = crtshResult.value.length;
      crtshSpinner.succeed(
        chalk.green(`Found ${count} subdomains from crt.sh`),
      );
    } else {
      crtshSpinner.fail(chalk.red('Failed to fetch data from crt.sh'));
    }

    const rapid7Spinner = ora({
      text: chalk.cyan('Fetching data from Rapid7 dataset...'),
      spinner: 'dots',
    }).start();

    const rapid7Result = await getRapid7Results(domain);

    if (rapid7Result.isOk()) {
      const count = rapid7Result.value.length;
      rapid7Spinner.succeed(
        chalk.green(`Found ${count} subdomains from Rapid7`),
      );
    } else {
      rapid7Spinner.fail(chalk.red('Failed to fetch data from Rapid7'));
    }

    const subdomains = new Set<string>();

    // Add successful results to the set
    if (crtshResult.isOk()) {
      crtshResult.value.forEach((d) => subdomains.add(d));
    }
    if (rapid7Result.isOk()) {
      rapid7Result.value.forEach((d) => subdomains.add(d));
    }

    // If no subdomains found, return empty array
    if (subdomains.size === 0) {
      logger.warn(chalk.yellow(`No subdomains found for ${domain}`));
      return [];
    }

    const verificationSpinner = ora({
      text: chalk.cyan(
        `Starting verification of ${subdomains.size} unique subdomains...`,
      ),
      spinner: 'dots',
    }).start();

    let verifiedCount = 0;
    // Verify all discovered subdomains concurrently
    const results = await pMap(
      Array.from(subdomains),
      async (subdomain) => {
        const source = subdomain.includes('crt.sh')
          ? 'crtsh'
          : 'rapid7';
        const result = await verifySubdomain(subdomain, source);
        verifiedCount++;
        verificationSpinner.text = chalk.cyan(
          `Progress: ${verifiedCount}/${subdomains.size} subdomains verified (${Math.round((verifiedCount / subdomains.size) * 100)}%)`,
        );
        return result;
      },
      {
        concurrency: validatedOptions.threads,
      },
    );

    const aliveCount = results.filter((r) => r.isAlive).length;
    verificationSpinner.succeed(
      chalk.green(
        `Scan completed for ${domain}. Found ${results.length} subdomains (${aliveCount} alive)`,
      ),
    );

    return results;
  };

  return { scan };
};
