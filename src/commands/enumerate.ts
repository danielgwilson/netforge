import { Command } from 'commander';
import {
  createScanner,
  type SubdomainResult,
} from '../scanners/subdomain-scanner.js';
import { logger } from '../utils/logger.js';
import { writeFile } from 'fs/promises';

export const enumerateCommand = new Command('enumerate')
  .description('Enumerate subdomains for a given domain')
  .requiredOption('-d, --domain <domain>', 'Target domain')
  .option(
    '-t, --threads <number>',
    'Number of concurrent threads',
    '10',
  )
  .option(
    '-r, --retries <number>',
    'Number of retries for failed requests',
    '3',
  )
  .option('-o, --output <file>', 'Output file for results')
  .option('--json', 'Output results as JSON')
  .action(async (opts) => {
    try {
      const scanner = createScanner({
        threads: parseInt(opts.threads),
        retries: parseInt(opts.retries),
      });

      logger.info(`Starting enumeration for ${opts.domain}`);
      const results = await scanner.scan(opts.domain);

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        // Display results in a table format
        console.table(
          results.map((r: SubdomainResult) => ({
            Subdomain: r.subdomain,
            Status: r.isAlive ? 'Active' : 'Inactive',
            IPs: r.resolvedIps.join(', '),
            Source: r.source,
            Error: r.error ?? '',
          })),
        );
      }

      if (opts.output) {
        await writeFile(
          opts.output,
          opts.json
            ? JSON.stringify(results, null, 2)
            : results
                .map(
                  (r: SubdomainResult) =>
                    `${r.subdomain},${r.isAlive},${r.resolvedIps.join(
                      '|',
                    )},${r.source}`,
                )
                .join('\n'),
        );
        logger.info(`Results saved to ${opts.output}`);
      }
    } catch (error) {
      logger.error(
        `Enumeration failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      process.exit(1);
    }
  });
