import { z } from 'zod';
import { config as loadEnv } from 'dotenv';

/**
 * Load environment variables from .env file if available.
 */
loadEnv();

/**
 * Zod schema defining the structure of our configuration.
 */
const configSchema = z.object({
  // Network settings
  DEFAULT_TIMEOUT: z.number().default(5000),
  DEFAULT_RETRIES: z.number().default(3),
  DEFAULT_THREADS: z.number().default(10),

  // DNS settings
  DNS_SERVERS: z.array(z.string()).default(['1.1.1.1', '1.0.0.1']),

  // API endpoints
  API_ENDPOINTS: z.object({
    CRTSH: z.string().default('https://crt.sh'),
    RAPID7: z.string().default('https://sonar.omnisint.io'),
  }),

  // Feature flags
  ENABLE_BRUTE_FORCE: z.boolean().default(false),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const CONFIG = configSchema.parse({
  DEFAULT_TIMEOUT: parseInt(process.env.DEFAULT_TIMEOUT ?? '5000'),
  DEFAULT_RETRIES: parseInt(process.env.DEFAULT_RETRIES ?? '3'),
  DEFAULT_THREADS: parseInt(process.env.DEFAULT_THREADS ?? '10'),
  DNS_SERVERS: process.env.DNS_SERVERS?.split(',') ?? [
    '1.1.1.1',
    '1.0.0.1',
  ],
  API_ENDPOINTS: {
    CRTSH: process.env.CRTSH_API_URL ?? 'https://crt.sh',
    RAPID7: process.env.RAPID7_API_URL ?? 'https://sonar.omnisint.io',
  },
  ENABLE_BRUTE_FORCE: process.env.ENABLE_BRUTE_FORCE === 'true',
  LOG_LEVEL: (process.env.LOG_LEVEL as any) ?? 'info',
});

export type Config = z.infer<typeof configSchema>;
