import Table from 'cli-table3';
import chalk from 'chalk';
import type {
  SubdomainResult,
  NetworkTestResult,
  MTRHop,
  PortScanResult,
  DNSRecord,
} from '../types';

export function displayResults(
  subdomains: SubdomainResult[],
  networkResults: NetworkTestResult[]
): void {
  // Display subdomain results
  console.log(chalk.cyan('\nDiscovered Subdomains:'));

  const subdomainTable = new Table({
    head: ['Domain', 'IP', 'Source', 'Latency'].map((h) => chalk.bold(h)),
    style: {
      head: [],
      border: [],
    },
  });

  subdomains.forEach((s) => {
    subdomainTable.push([
      s.domain,
      s.ip ?? 'N/A',
      s.source,
      s.latency ? `${s.latency.toFixed(2)}ms` : 'N/A',
    ]);
  });

  console.log(subdomainTable.toString());

  // Display network test results if available
  if (networkResults.length > 0) {
    console.log(chalk.cyan('\nNetwork Analysis:'));
    for (const result of networkResults) {
      console.log(chalk.bold(`\nTarget: ${result.target}`));

      if (result.avgLatency) {
        console.log(`Average Latency: ${result.avgLatency.toFixed(2)}ms`);
      }

      if (result.packetLoss !== undefined) {
        console.log(`Packet Loss: ${result.packetLoss}%`);
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
}

function displayMTRResults(hops: MTRHop[]): void {
  console.log(chalk.cyan('\nMTR Analysis:'));

  const mtrTable = new Table({
    head: ['Hop', 'Host', 'Loss %', 'Sent', 'Last', 'Avg', 'Best', 'Worst'].map(
      (h) => chalk.bold(h)
    ),
    style: {
      head: [],
      border: [],
    },
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

function displayPortResults(ports: PortScanResult[]): void {
  console.log(chalk.cyan('\nPort Scan Results:'));

  const portTable = new Table({
    head: ['Port', 'State', 'Service'].map((h) => chalk.bold(h)),
    style: {
      head: [],
      border: [],
    },
  });

  ports.forEach((port) => {
    portTable.push([
      port.port.toString(),
      port.state,
      port.service ?? 'Unknown',
    ]);
  });

  console.log(portTable.toString());
}

function displayDNSResults(records: DNSRecord[]): void {
  console.log(chalk.cyan('\nDNS Records:'));

  const dnsTable = new Table({
    head: ['Type', 'Value', 'TTL'].map((h) => chalk.bold(h)),
    style: {
      head: [],
      border: [],
    },
  });

  records.forEach((record) => {
    dnsTable.push([record.type, record.value, record.ttl.toString()]);
  });

  console.log(dnsTable.toString());
}

export function displayTraceResults(result: NetworkTestResult): void {
  console.log(chalk.cyan('\nTrace Results:'));

  if (result.mtr?.length) {
    displayMTRResults(result.mtr);
  }

  if (result.avgLatency) {
    console.log(`\nAverage Latency: ${result.avgLatency.toFixed(2)}ms`);
  }

  if (result.packetLoss !== undefined) {
    console.log(`Packet Loss: ${result.packetLoss}%`);
  }
}
