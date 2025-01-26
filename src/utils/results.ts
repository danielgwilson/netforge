import { writeFile } from 'fs/promises';
import {
  SubdomainVerificationResult,
  NetworkTestResult,
} from '../types';

interface ScanResults {
  subdomains: SubdomainVerificationResult[];
  networkResults?: NetworkTestResult[];
}

/**
 * Saves the scanning results to a JSON file.
 * @param filepath Where to save the file
 * @param results The results object
 */
export async function saveResults(
  filepath: string,
  results: ScanResults,
): Promise<void> {
  try {
    await writeFile(
      filepath,
      JSON.stringify(results, null, 2),
      'utf-8',
    );
  } catch (error) {
    throw new Error(
      `Failed to save results to ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
