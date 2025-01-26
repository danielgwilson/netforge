export interface SubdomainResult {
  domain: string;
  ip?: string;
  source: 'crt.sh' | 'brute-force' | 'dns' | 'rapid7';
  timestamp: Date;
  resolves: boolean;
  ports?: number[];
  latency?: number;
}

export interface NetworkTestResult {
  target: string;
  timestamp: Date;
  avgLatency?: number;
  packetLoss?: number;
  mtr?: MTRHop[];
  ports?: PortScanResult[];
  dnsRecords?: DNSRecord[];
}

export interface MTRHop {
  hop: number;
  host: string;
  loss: number;
  sent: number;
  last: number;
  avg: number;
  best: number;
  worst: number;
  stDev: number;
}

export interface PortScanResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service?: string;
}

export interface DNSRecord {
  type: string;
  value: string;
  ttl: number;
}
