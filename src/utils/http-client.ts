import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface HttpClient {
  get<T = any>(url: string): Promise<AxiosResponse<T>>;
  head(url: string): Promise<AxiosResponse>;
  post<T = any>(url: string, data?: any): Promise<AxiosResponse<T>>;
}

/**
 * Creates an HTTP client with retry and timeout capabilities
 * @param options Configuration options for the HTTP client
 * @returns An HTTP client instance
 */
export const createHttpClient = (
  options: HttpClientOptions = {},
): HttpClient => {
  const instance: AxiosInstance = axios.create({
    timeout: options.timeout ?? 5000,
    headers: {
      'User-Agent': 'NetForge/1.0',
      ...options.headers,
    },
  });

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(
          `HTTP ${error.response.status}: ${error.response.statusText}`,
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Request failed: ${error.message}`);
      }
    },
  );

  return instance;
};
