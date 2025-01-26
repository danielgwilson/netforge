import { writeFile } from 'fs/promises';
import type { SubdomainResult, NetworkTestResult } from '../types';

interface ScanResults {
  subdomains: SubdomainResult[];
  networkResults: NetworkTestResult[];
}

export async function saveResults(
  filepath: string,
  results: ScanResults
): Promise<void> {
  try {
    await writeFile(filepath, JSON.stringify(results, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to save results to ${filepath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
