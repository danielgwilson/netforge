import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as dns } from 'dns';
import net from 'net';
import type {
  NetworkTestResult,
  MTRHop,
  PortScanResult,
  DNSRecord,
} from '../types/index.js';
import pMap from 'p-map';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

export class NetworkTester {
  private readonly enableMTR: boolean;
  private readonly enablePortScan: boolean;
  private readonly enableDNS: boolean;
  private readonly packetCount: number;

  constructor(options: {
    enableMTR?: boolean;
    enablePortScan?: boolean;
    enableDNS?: boolean;
    packetCount?: number;
  }) {
    this.enableMTR = options.enableMTR ?? false;
    this.enablePortScan = options.enablePortScan ?? false;
    this.enableDNS = options.enableDNS ?? false;
    this.packetCount = options.packetCount ?? 10;
  }

  async analyze(target: string): Promise<NetworkTestResult> {
    const result: NetworkTestResult = {
      target,
      timestamp: new Date(),
    };

    await Promise.all([
      this.enableMTR &&
        this.runMTR(target).then((mtr) => (result.mtr = mtr)),
      this.enablePortScan &&
        this.scanPorts(target).then((ports) => (result.ports = ports)),
      this.enableDNS &&
        this.getDNSRecords(target).then(
          (records) => (result.dnsRecords = records),
        ),
      this.measureLatency(target).then(
        (latency) => (result.avgLatency = latency),
      ),
    ]);

    return result;
  }

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
      logger.error(
        `MTR failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return [];
    }
  }

  private async scanPorts(target: string): Promise<PortScanResult[]> {
    const commonPorts = [
      21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306,
      3389, 5432, 8080, 8443,
    ];
    const results: PortScanResult[] = [];

    await pMap(
      commonPorts,
      async (port) => {
        try {
          const socket = new net.Socket();
          const promise = new Promise<void>((resolve, reject) => {
            socket.setTimeout(1500);

            socket.on('connect', () => {
              socket.destroy();
              resolve();
            });

            socket.on('timeout', () => {
              socket.destroy();
              reject(new Error('timeout'));
            });

            socket.on('error', reject);
          });

          socket.connect(port, target);
          await promise;

          results.push({
            port,
            state: 'open',
            service: this.getServiceName(port),
          });
        } catch {
          results.push({
            port,
            state: 'closed',
          });
        }
      },
      { concurrency: 10 },
    );

    return results;
  }

  private async getDNSRecords(target: string): Promise<DNSRecord[]> {
    const records: DNSRecord[] = [];
    const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA'] as const;

    for (const type of types) {
      try {
        const result = await dns.resolve(target, type);
        records.push({
          type,
          value: Array.isArray(result)
            ? result.join(', ')
            : String(result),
          ttl: 0, // Note: Node.js dns module doesn't provide TTL
        });
      } catch {
        // Record type doesn't exist for this domain
      }
    }

    return records;
  }

  private async measureLatency(target: string): Promise<number> {
    try {
      const samples = 4;
      let total = 0;

      for (let i = 0; i < samples; i++) {
        const start = process.hrtime();
        await dns.resolve4(target);
        const [seconds, nanoseconds] = process.hrtime(start);
        total += seconds * 1000 + nanoseconds / 1000000;
      }

      return total / samples;
    } catch {
      return -1;
    }
  }

  private getServiceName(port: number): string {
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
}
