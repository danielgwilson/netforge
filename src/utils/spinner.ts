import ora, { Ora } from 'ora';
import chalk from 'chalk';

let isSpinnerEnabled = true;

/**
 * Toggle spinner usage, useful for disabling spinners in test environments.
 */
export function setSpinnerEnabled(enabled: boolean): void {
  isSpinnerEnabled = enabled;
}

/**
 * A helper to create an Ora spinner but allows toggling globally.
 */
export function createSpinner(text: string): Ora {
  return isSpinnerEnabled
    ? ora({ text: chalk.cyan(text), spinner: 'dots2' })
    : ({
        start: () => undefined,
        succeed: () => undefined,
        fail: () => undefined,
        warn: () => undefined,
        text,
      } as unknown as Ora);
}
