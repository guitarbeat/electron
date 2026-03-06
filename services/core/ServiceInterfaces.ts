/**
 * Standardized service interfaces for consistent architecture
 */

export interface ServiceResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  metadata?: {
    timestamp: number;
    etag?: string;
    cached?: boolean;
  };
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  enableETag?: boolean;
  maxSize?: number;
}

export interface PollingOptions {
  interval: number;
  enabled?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export interface MutationOptions<T> {
  optimisticUpdate?: boolean;
  rollbackOnError?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ServiceError) => void;
}

export interface BaseService<T> {
  fetch(): Promise<ServiceResponse<T>>;
  save(data: T): Promise<ServiceResponse<T>>;
  clearCache?(): void;
  getCachedData?(): T | null;
}

export interface PollableService<T> extends BaseService<T> {
  subscribe(callback: (data: T) => void): () => void;
  unsubscribe?(): void;
  refresh?(): Promise<void>;
}

export interface MutableService<T> extends BaseService<T> {
  create(item: T): Promise<ServiceResponse<T>>;
  update(id: string, updates: Partial<T>): Promise<ServiceResponse<T>>;
  delete(id: string): Promise<ServiceResponse<void>>;
}

export interface SearchableService<T> extends BaseService<T> {
  search(query: string): Promise<ServiceResponse<T[]>>;
  filter(predicate: (item: T) => boolean): Promise<ServiceResponse<T[]>>;
}

// Type guards for service validation
export function isServiceResponse<T>(obj: any): obj is ServiceResponse<T> {
  return obj && typeof obj === 'object' && 'data' in obj && 'success' in obj;
}

export function isServiceError(obj: any): obj is ServiceError {
  return obj && typeof obj === 'object' && 'code' in obj && 'message' in obj;
}

// Standard error codes
export enum ServiceErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Helper functions for creating standard responses
export function createSuccessResponse<T>(data: T, metadata?: ServiceResponse<T>['metadata']): ServiceResponse<T> {
  return {
    data,
    success: true,
    metadata: {
      timestamp: Date.now(),
      ...metadata,
    },
  };
}

export function createErrorResponse<T>(error: ServiceError): ServiceResponse<T> {
  return {
    data: null as T,
    success: false,
    error: error.message,
    metadata: {
      timestamp: Date.now(),
    },
  };
}

export function createServiceError(
  code: ServiceErrorCode,
  message: string,
  details?: any
): ServiceError {
  return {
    code,
    message,
    details,
  };
}
