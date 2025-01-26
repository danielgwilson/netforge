import { promises as dns } from 'dns';
import pRetry from 'p-retry';
import { CONFIG } from '../config';

export interface DnsResolver {
  resolve(hostname: string): Promise<string[]>;
  reverse(ip: string): Promise<string[]>;
}

/**
 * Creates a DNS resolver respecting user-configured nameservers and retries.
 */
export function createDnsResolver(): DnsResolver {
  const resolver = new dns.Resolver();
  resolver.setServers(CONFIG.DNS_SERVERS);

  return {
    async resolve(hostname: string): Promise<string[]> {
      try {
        return await pRetry(() => resolver.resolve4(hostname), {
          retries: CONFIG.DEFAULT_RETRIES,
          minTimeout: 500,
          maxTimeout: 3000,
        });
      } catch (error) {
        throw new Error(
          `DNS resolution failed for ${hostname}: ${error instanceof Error ? error.message : ''}`,
        );
      }
    },

    async reverse(ip: string): Promise<string[]> {
      try {
        return await pRetry(() => resolver.reverse(ip), {
          retries: CONFIG.DEFAULT_RETRIES,
          minTimeout: 500,
          maxTimeout: 3000,
        });
      } catch (error) {
        throw new Error(
          `Reverse DNS lookup failed for ${ip}: ${error instanceof Error ? error.message : ''}`,
        );
      }
    },
  };
}
