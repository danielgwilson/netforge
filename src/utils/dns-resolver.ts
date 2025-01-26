import { promises as dns } from 'dns';
import pRetry from 'p-retry';

export interface DnsResolverOptions {
  retries?: number;
  nameservers?: string[];
}

export interface DnsResolver {
  resolve(hostname: string): Promise<string[]>;
  reverse(ip: string): Promise<string[]>;
}

/**
 * Creates a DNS resolver with retry capabilities
 * @param options Configuration options for the DNS resolver
 * @returns A DNS resolver instance
 */
export const createDnsResolver = (
  options: DnsResolverOptions = {},
): DnsResolver => {
  const resolver = new dns.Resolver();

  if (options.nameservers?.length) {
    resolver.setServers(options.nameservers);
  }

  return {
    async resolve(hostname: string): Promise<string[]> {
      try {
        return await pRetry(() => resolver.resolve4(hostname), {
          retries: options.retries ?? 3,
          onFailedAttempt: (error) => {
            console.error(
              `Failed to resolve ${hostname}. ${error.retriesLeft} retries left.`,
            );
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `DNS resolution failed for ${hostname}: ${error.message}`,
          );
        }
        throw error;
      }
    },

    async reverse(ip: string): Promise<string[]> {
      try {
        return await pRetry(() => resolver.reverse(ip), {
          retries: options.retries ?? 3,
          onFailedAttempt: (error) => {
            console.error(
              `Failed to reverse lookup ${ip}. ${error.retriesLeft} retries left.`,
            );
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `Reverse DNS lookup failed for ${ip}: ${error.message}`,
          );
        }
        throw error;
      }
    },
  };
};
