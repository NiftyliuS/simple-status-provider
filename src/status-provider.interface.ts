export enum ProviderStatuses {
  OK = 'OK',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  DISABLED = 'DISABLED',
  NA = 'NA',
}

export enum ProviderHealthStatuses {
  HEALTHY = 'HEALTHY',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
  BUSY = 'BUSY',
  NA = 'NA',
}

export interface ProviderReadyResponse {
  ready: boolean;
}

export interface ProviderLivelinessResponse {
  alive: boolean;
}
export interface ProviderStatusMemoryUsageInterface {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface ProviderStatusResponse {
  error: boolean;
  ready: boolean;
  alive: boolean;
  databaseResponseTime?: number;
  natsResponseTime?: number;
  redisResponseTime?: number;
  rabbitMqResponseTime?: number;
  rabbitMqQueueSize?: number;
  database?: ProviderStatuses;
  nats?: ProviderStatuses;
  redis?: ProviderStatuses;
  rabbitMq?: ProviderStatuses;
  ramUsage?: ProviderStatusMemoryUsageInterface;
}

export interface ProviderHealthResponse {
  error: boolean;
  status: ProviderHealthStatuses;
}

export interface ProviderOptionsInterface {
  port: number;
  host?: string;
  dbEnabled?: boolean;
  natsEnabled?: boolean;
  redisEnabled?: boolean;
  rabbitMqEnabled?: boolean;
  silent?: boolean;
  readiness: () => Promise<ProviderReadyResponse> | ProviderReadyResponse;
  liveliness: () => Promise<ProviderLivelinessResponse> | ProviderLivelinessResponse;
  status: () => Promise<ProviderStatusResponse> | ProviderStatusResponse;
  health: () => Promise<ProviderHealthResponse> | ProviderHealthResponse;
}
