/**
 * Represents the results of a subdomain after scanning.
 */
export interface SubdomainVerificationResult {
  subdomain: string;
  isAlive: boolean;
  resolvedIps: string[];
  source: 'crtsh' | 'rapid7' | 'bruteforce';
  error?: string;
}

/**
 * Represents the final network test result for a target.
 */
export interface NetworkTestResult {
  target: string;
  timestamp: Date;
  avgLatency?: number;
  packetLoss?: number;
  mtr?: MTRHop[];
  ports?: PortScanResult[];
  dnsRecords?: DNSRecord[];
}

/**
 * Represents a single MTR hop entry in a network trace.
 */
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

/**
 * Represents a port scan result for a single port.
 */
export interface PortScanResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service?: string;
}

/**
 * Represents a DNS record fetched during network analysis.
 */
export interface DNSRecord {
  type: string;
  value: string;
  ttl: number;
}
