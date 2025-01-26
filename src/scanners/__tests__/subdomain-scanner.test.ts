import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createScanner } from '../subdomain-scanner';
import type { HttpClient } from '../../utils/http-client';
import type { DnsResolver } from '../../utils/dns-resolver';
import type { AxiosResponse } from 'axios';

describe('SubdomainScanner', () => {
  let mockHttpClient: HttpClient;
  let mockDnsResolver: DnsResolver;

  beforeEach(() => {
    // Reset mocks before each test
    mockHttpClient = {
      get: vi.fn<[string], Promise<AxiosResponse>>(),
      head: vi.fn<[string], Promise<AxiosResponse>>(),
      post: vi.fn<[string, any?], Promise<AxiosResponse>>(),
    };

    mockDnsResolver = {
      resolve: vi.fn<[string], Promise<string[]>>(),
      reverse: vi.fn<[string], Promise<string[]>>(),
    };
  });

  it('should successfully scan and verify subdomains', async () => {
    // Mock successful HTTP responses
    (mockHttpClient.get as any).mockImplementation((url: string) => {
      if (url.includes('crt.sh')) {
        return Promise.resolve({
          data: [
            { name_value: 'test1.example.com' },
            { name_value: 'test2.example.com' },
          ],
        });
      }
      if (url.includes('sonar.omnisint.io')) {
        return Promise.resolve({
          data: ['test3.example.com', 'test4.example.com'],
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    // Mock successful DNS resolution
    (mockDnsResolver.resolve as any).mockResolvedValue(['1.2.3.4']);

    // Mock successful HTTP connectivity checks
    (mockHttpClient.head as any).mockResolvedValue({});

    const scanner = createScanner(
      { threads: 2 },
      { httpClient: mockHttpClient, dnsResolver: mockDnsResolver },
    );

    const results = await scanner.scan('example.com');

    // Verify results
    expect(results).toHaveLength(4);
    expect(results).toContainEqual(
      expect.objectContaining({
        subdomain: 'test1.example.com',
        isAlive: true,
        resolvedIps: ['1.2.3.4'],
      }),
    );
  });

  it('should handle API failures gracefully', async () => {
    // Mock failed HTTP responses
    (mockHttpClient.get as any).mockRejectedValue(
      new Error('API Error'),
    );
    (mockDnsResolver.resolve as any).mockResolvedValue([]);

    const scanner = createScanner(
      { threads: 2, retries: 1 }, // Reduce retries for faster test
      { httpClient: mockHttpClient, dnsResolver: mockDnsResolver },
    );

    const results = await scanner.scan('example.com');

    // Should return empty array when APIs fail
    expect(results).toHaveLength(0);
    // With 2 endpoints and 2 retries each (1 initial + 1 retry)
    expect(mockHttpClient.get).toHaveBeenCalledTimes(4);
  });

  it('should handle DNS resolution failures', async () => {
    // Mock successful HTTP responses but failed DNS
    (mockHttpClient.get as any).mockResolvedValue({
      data: [{ name_value: 'test.example.com' }],
    });
    (mockDnsResolver.resolve as any).mockRejectedValue(
      new Error('DNS Error'),
    );

    const scanner = createScanner(
      { threads: 2 },
      { httpClient: mockHttpClient, dnsResolver: mockDnsResolver },
    );

    const results = await scanner.scan('example.com');

    // Should include the subdomain but mark it as not alive
    expect(results[0]).toEqual(
      expect.objectContaining({
        subdomain: 'test.example.com',
        isAlive: false,
        resolvedIps: [],
        error: expect.stringContaining('DNS Error'),
      }),
    );
  });

  it('should respect thread limit for concurrent operations', async () => {
    // Mock responses that take time
    (mockHttpClient.get as any).mockResolvedValue({
      data: Array(10)
        .fill(0)
        .map((_, i) => ({ name_value: `test${i}.example.com` })),
    });
    (mockDnsResolver.resolve as any).mockImplementation(
      () =>
        new Promise<string[]>((resolve) =>
          setTimeout(() => resolve(['1.2.3.4']), 100),
        ),
    );

    const scanner = createScanner(
      { threads: 2 },
      { httpClient: mockHttpClient, dnsResolver: mockDnsResolver },
    );

    const startTime = Date.now();
    await scanner.scan('example.com');
    const duration = Date.now() - startTime;

    // With 10 subdomains and 2 threads, should take at least 500ms
    expect(duration).toBeGreaterThan(500);
  });
});
