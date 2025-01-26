import chalk from 'chalk';
import { CONFIG } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getCurrentLogLevel = () => LOG_LEVELS[CONFIG.LOG_LEVEL];

const shouldLog = (level: LogLevel) =>
  LOG_LEVELS[level] >= getCurrentLogLevel();

const formatMessage = (
  level: LogLevel,
  message: string,
  ...args: any[]
) => {
  const timestamp = new Date().toISOString();
  const formattedArgs = args
    .map((arg) =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
    )
    .join(' ');

  return `${timestamp} [${level.toUpperCase()}] ${message} ${formattedArgs}`.trim();
};

export const logger = {
  debug(message: string, ...args: any[]) {
    if (shouldLog('debug')) {
      console.debug(
        chalk.gray(formatMessage('debug', message, ...args)),
      );
    }
  },

  info(message: string, ...args: any[]) {
    if (shouldLog('info')) {
      console.info(chalk.blue(formatMessage('info', message, ...args)));
    }
  },

  warn(message: string, ...args: any[]) {
    if (shouldLog('warn')) {
      console.warn(
        chalk.yellow(formatMessage('warn', message, ...args)),
      );
    }
  },

  error(message: string, ...args: any[]) {
    if (shouldLog('error')) {
      console.error(
        chalk.red(formatMessage('error', message, ...args)),
      );
    }
  },
};
