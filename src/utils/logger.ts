import chalk from 'chalk';
import { CONFIG } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = LOG_LEVELS[CONFIG.LOG_LEVEL] ?? LOG_LEVELS.info;

/**
 * Checks if a given log level is above or equal to the current configured level.
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLogLevel;
}

/**
 * Basic logger with colored output depending on severity.
 */
export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog('debug')) {
      console.debug(chalk.gray(formatMessage('debug', message, args)));
    }
  },
  info(message: string, ...args: unknown[]) {
    if (shouldLog('info')) {
      console.info(chalk.blue(formatMessage('info', message, args)));
    }
  },
  warn(message: string, ...args: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(chalk.yellow(formatMessage('warn', message, args)));
    }
  },
  error(message: string, ...args: unknown[]) {
    if (shouldLog('error')) {
      console.error(chalk.red(formatMessage('error', message, args)));
    }
  },
};

function formatMessage(
  level: LogLevel,
  message: string,
  args: unknown[],
): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args
    .map((arg) =>
      typeof arg === 'object'
        ? JSON.stringify(arg, null, 2)
        : String(arg),
    )
    .join(' ');
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${formattedArgs}`.trim();
}
