import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as dns } from 'dns';
import net from 'net';
import pMap from 'p-map';
import { logger } from '../utils/logger.js';
import {
  NetworkTestResult,
  MTRHop,
  PortScanResult,
  DNSRecord,
} from '../types';
import { CONFIG } from '../config.js';

const execAsync = promisify(exec);

/**
 * Analyzes a target using optional MTR, port scanning, DNS queries, and latency measurement.
 */
export class NetworkTester {
  private readonly enableMTR: boolean;
  private readonly enablePortScan: boolean;
  private readonly enableDNS: boolean;
  private readonly packetCount: number;

  constructor(
    options: {
      enableMTR?: boolean;
      enablePortScan?: boolean;
      enableDNS?: boolean;
      packetCount?: number;
    } = {},
  ) {
    this.enableMTR = options.enableMTR ?? false;
    this.enablePortScan = options.enablePortScan ?? false;
    this.enableDNS = options.enableDNS ?? false;
    this.packetCount = options.packetCount ?? 5;
  }

  /**
   * Runs all enabled tests (MTR, port scan, DNS, latency) and aggregates results.
   */
  public async analyze(target: string): Promise<NetworkTestResult> {
    const result: NetworkTestResult = {
      target,
      timestamp: new Date(),
    };

    // MTR, DNS, PortScan, Latency can be run in parallel
    await Promise.all([
      this.enableMTR &&
        this.runMTR(target).then((m) => (result.mtr = m)),
      this.enablePortScan &&
        this.scanPorts(target).then((p) => (result.ports = p)),
      this.enableDNS &&
        this.getDNSRecords(target).then((r) => (result.dnsRecords = r)),
      this.measureLatency(target).then((l) => (result.avgLatency = l)),
    ]);

    return result;
  }

  /**
   * Runs MTR on a target if the system has mtr installed.
   */
  private async runMTR(target: string): Promise<MTRHop[]> {
    try {
      const { stdout } = await execAsync(
        `mtr -j -c ${this.packetCount} ${target}`,
      );
      const mtrData = JSON.parse(stdout);

      return mtrData.hubs.map((hub: any) => ({
        hop: hub.count,
        host: hub.host,
        loss: hub.Loss,
        sent: hub.Snt,
        last: hub.Last,
        avg: hub.Avg,
        best: hub.Best,
        worst: hub.Wrst,
        stDev: hub.StDev,
      }));
    } catch (error) {
      logger.error(`MTR failed: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Scans common ports on the target to see which are open.
   */
  private async scanPorts(target: string): Promise<PortScanResult[]> {
    const commonPorts = [
      21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306,
      3389, 5432, 8080, 8443,
    ];
    const results: PortScanResult[] = [];

    await pMap(
      commonPorts,
      async (port) => {
        let state: 'open' | 'closed' | 'filtered' = 'closed';
        try {
          await checkPortOpen(target, port, 1500);
          state = 'open';
        } catch {
          // closed
        }
        results.push({
          port,
          state,
          service: guessServiceName(port),
        });
      },
      { concurrency: 10 },
    );

    return results;
  }

  /**
   * Fetches DNS records (A, AAAA, MX, NS, TXT, SOA) for the target.
   */
  private async getDNSRecords(target: string): Promise<DNSRecord[]> {
    const recordTypes: Array<
      | keyof dns.ResolveWithTtlOptions
      | 'MX'
      | 'TXT'
      | 'NS'
      | 'SOA'
      | 'AAAA'
    > = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA'];

    const results: DNSRecord[] = [];

    for (const type of recordTypes) {
      try {
        const entries = await dns.resolve(target, type as any);
        // Node DNS doesn't provide TTL with some record types easily
        if (Array.isArray(entries)) {
          results.push({
            type,
            value: entries.join(', '),
            ttl: 0,
          });
        }
      } catch {
        // Ignore DNS query failures for missing record types
      }
    }

    return results;
  }

  /**
   * Measures average DNS lookup time over multiple attempts.
   */
  private async measureLatency(target: string): Promise<number> {
    const samples = 3;
    let total = 0;
    for (let i = 0; i < samples; i++) {
      const start = process.hrtime();
      try {
        await dns.resolve4(target);
      } catch {
        return -1;
      }
      const [sec, nano] = process.hrtime(start);
      total += sec * 1000 + nano / 1_000_000;
    }
    return total / samples;
  }
}

/**
 * Checks if a port is open by attempting to connect within a specified timeout.
 */
async function checkPortOpen(
  host: string,
  port: number,
  timeout: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve();
    });
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('timeout'));
    });
    socket.once('error', () => {
      if (!isConnected) {
        reject(new Error('connection failed'));
      }
    });

    socket.connect(port, host);
  });
}

/**
 * Heuristically guess the service name for a common port.
 */
function guessServiceName(port: number): string {
  const services: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    465: 'SMTPS',
    587: 'Submission',
    993: 'IMAPS',
    995: 'POP3S',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt',
  };
  return services[port] ?? 'Unknown';
}
