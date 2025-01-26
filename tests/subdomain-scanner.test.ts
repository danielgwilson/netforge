import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubdomainScanner } from '../src/scanners/subdomain-scanner.js';
import { HttpClient } from '../src/utils/http-client.js';
import { DnsResolver } from '../src/utils/dns-resolver.js';

/**
 * Basic test suite for SubdomainScanner with mocked dependencies.
 */
describe('SubdomainScanner', () => {
  let mockHttpClient: HttpClient;
  let mockDnsResolver: DnsResolver;
  let scanner: SubdomainScanner;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      head: vi.fn(),
      post: vi.fn(),
    };
    mockDnsResolver = {
      resolve: vi.fn(),
      reverse: vi.fn(),
    };
    scanner = new SubdomainScanner(2);

    // @ts-expect-error Force override the private fields for test mocking
    scanner.http = mockHttpClient;
    // @ts-expect-error
    scanner.dnsResolver = mockDnsResolver;
  });

  it('should return verified subdomains when data sources succeed', async () => {
    (mockHttpClient.get as any).mockImplementation(
      async (url: string) => {
        if (url.includes('crt.sh')) {
          return {
            data: [
              { name_value: 'test1.example.com' },
              { name_value: 'test2.example.com' },
            ],
          };
        }
        if (url.includes('sonar.omnisint.io')) {
          return { data: ['test3.example.com', 'test4.example.com'] };
        }
        throw new Error('Unknown endpoint');
      },
    );

    (mockDnsResolver.resolve as any).mockResolvedValue(['1.2.3.4']);
    (mockHttpClient.head as any).mockResolvedValue({});

    const results = await scanner.scan('example.com');
    expect(results).toHaveLength(4);
    expect(results.filter((r) => r.isAlive)).toHaveLength(4);
  });

  it('should handle errors from data sources gracefully', async () => {
    (mockHttpClient.get as any).mockRejectedValue(
      new Error('API Error'),
    );
    (mockDnsResolver.resolve as any).mockResolvedValue([]);

    const results = await scanner.scan('example.com');
    // Because the data fetch fails, we expect 0 subdomains discovered
    expect(results).toEqual([]);
  });

  it('should correctly mark subdomain as inactive if DNS fails', async () => {
    (mockHttpClient.get as any).mockResolvedValue({
      data: [{ name_value: 'test.example.com' }],
    });
    (mockDnsResolver.resolve as any).mockRejectedValue(
      new Error('DNS Error'),
    );

    const results = await scanner.scan('example.com');
    expect(results[0].isAlive).toBe(false);
    expect(results[0].error).toMatch(/DNS Error/);
  });
});
