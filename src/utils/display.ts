import Table from 'cli-table3';
import chalk from 'chalk';
import {
  SubdomainVerificationResult,
  NetworkTestResult,
  MTRHop,
  PortScanResult,
  DNSRecord,
} from '../types';

/**
 * Displays a list of subdomain verification results in a CLI table.
 */
export function displaySubdomainResults(
  subdomains: SubdomainVerificationResult[],
): void {
  console.log(chalk.cyan('\nDiscovered Subdomains:'));

  const subdomainTable = new Table({
    head: ['Subdomain', 'IPs', 'Source', 'Alive?'].map((h) =>
      chalk.bold(h),
    ),
    style: { head: [], border: [] },
  });

  subdomains.forEach((s) => {
    subdomainTable.push([
      s.subdomain,
      s.resolvedIps.join(', ') || 'N/A',
      s.source,
      s.isAlive ? chalk.green('YES') : chalk.red('NO'),
    ]);
  });

  console.log(subdomainTable.toString());
}

/**
 * Displays network test results (MTR, DNS, etc.) in the console.
 */
export function displayNetworkResults(
  results: NetworkTestResult[],
): void {
  if (results.length === 0) return;

  console.log(chalk.cyan('\nNetwork Analysis:'));

  for (const result of results) {
    console.log(chalk.bold(`\nTarget: ${result.target}`));
    if (result.avgLatency) {
      console.log(
        `  Average Latency: ${result.avgLatency.toFixed(2)} ms`,
      );
    }
    if (result.packetLoss !== undefined) {
      console.log(`  Packet Loss: ${result.packetLoss}%`);
    }
    if (result.mtr?.length) {
      displayMTRResults(result.mtr);
    }
    if (result.ports?.length) {
      displayPortResults(result.ports);
    }
    if (result.dnsRecords?.length) {
      displayDNSResults(result.dnsRecords);
    }
  }
}

/**
 * Displays MTR hops in a CLI table.
 */
function displayMTRResults(hops: MTRHop[]): void {
  console.log(chalk.cyan('\nMTR Analysis:'));

  const mtrTable = new Table({
    head: [
      'Hop',
      'Host',
      'Loss %',
      'Sent',
      'Last',
      'Avg',
      'Best',
      'Worst',
    ].map((h) => chalk.bold(h)),
    style: { head: [], border: [] },
  });

  hops.forEach((hop) => {
    mtrTable.push([
      hop.hop.toString(),
      hop.host,
      hop.loss.toString(),
      hop.sent.toString(),
      hop.last.toString(),
      hop.avg.toString(),
      hop.best.toString(),
      hop.worst.toString(),
    ]);
  });

  console.log(mtrTable.toString());
}

/**
 * Displays port scan results in a CLI table.
 */
function displayPortResults(ports: PortScanResult[]): void {
  console.log(chalk.cyan('\nPort Scan Results:'));

  const portTable = new Table({
    head: ['Port', 'State', 'Service'].map((h) => chalk.bold(h)),
    style: { head: [], border: [] },
  });

  ports.forEach((port) => {
    portTable.push([port.port, port.state, port.service ?? 'Unknown']);
  });

  console.log(portTable.toString());
}

/**
 * Displays DNS record results in a CLI table.
 */
function displayDNSResults(records: DNSRecord[]): void {
  console.log(chalk.cyan('\nDNS Records:'));

  const dnsTable = new Table({
    head: ['Type', 'Value', 'TTL'].map((h) => chalk.bold(h)),
    style: { head: [], border: [] },
  });

  records.forEach((record) => {
    dnsTable.push([record.type, record.value, record.ttl.toString()]);
  });

  console.log(dnsTable.toString());
}
