import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CONFIG } from '../config';

export interface HttpClient {
  get<T = any>(url: string): Promise<AxiosResponse<T>>;
  head<T = any>(url: string): Promise<AxiosResponse<T>>;
  post<T = any>(url: string, data?: any): Promise<AxiosResponse<T>>;
}

/**
 * Creates an HTTP client with retry/timeout capabilities,
 * defaulting to values from the central CONFIG.
 */
export function createHttpClient(): HttpClient {
  const instance: AxiosInstance = axios.create({
    timeout: CONFIG.DEFAULT_TIMEOUT,
    headers: {
      'User-Agent': 'NetForge/2.0',
    },
  });

  // We could add interceptors, custom logic, or a retry plugin if needed.
  return {
    get: instance.get,
    head: instance.head,
    post: instance.post,
  };
}
