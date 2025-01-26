import { Command } from 'commander';
import { SubdomainScanner } from '../scanners/subdomain-scanner.js';
import { logger } from '../utils/logger.js';
import { saveResults } from '../utils/results.js';
import { displaySubdomainResults } from '../utils/display.js';

/**
 * CLI command to enumerate subdomains for a given domain.
 */
export const enumerateSubdomainsCommand = new Command('enumerate')
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
      const domain = opts.domain;
      const threads = parseInt(opts.threads);
      // The config retries are global, but you can also parse opts.retries if you want dynamic changes

      const scanner = new SubdomainScanner(threads);
      logger.info(`Starting enumeration for ${domain}`);

      const results = await scanner.scan(domain);

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        displaySubdomainResults(results);
      }

      if (opts.output) {
        await saveResults(opts.output, { subdomains: results });
        logger.info(`Results saved to ${opts.output}`);
      }
    } catch (error) {
      logger.error(`Enumeration failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });
