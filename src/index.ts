#!/usr/bin/env node

import { Command } from 'commander';
import { enumerateCommand } from './commands/enumerate.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('netforge')
  .description(
    'Advanced network reconnaissance and troubleshooting toolkit',
  )
  .version('1.0.0');

program.addCommand(enumerateCommand);

program
  .command('trace')
  .description('Perform advanced network path analysis')
  .requiredOption('-t, --target <host>', 'Target host or IP')
  .option('-c, --count <number>', 'Number of packets to send', '10')
  .option('--json', 'Output results as JSON')
  .action(async (opts) => {
    try {
      logger.info(`Starting trace to ${opts.target}`);
      // TODO: Implement network tracing
      logger.info('Trace analysis not yet implemented');
    } catch (error) {
      logger.error(
        `Trace failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      process.exit(1);
    }
  });

program.parse();
