import { ErrorCategory, ERROR_CATEGORY } from "../types";
import {
  ErrorReply,
  ConnectionTimeoutError,
  SocketTimeoutError,
  SocketClosedUnexpectedlyError,
  ReconnectStrategyError,
  SocketTimeoutDuringMaintenanceError,
  CommandTimeoutDuringMaintenanceError,
} from "../../errors";

/**
 * Result of analyzing an error for OpenTelemetry attributes.
 */
export interface ErrorInfo {
  /**
   * The error type (class name or constructor name).
   * Maps to OTel attribute: error.type
   */
  errorType: string;

  /**
   * The error category for Redis client errors.
   * Maps to OTel attribute: redis.client.errors.category
   */
  category: ErrorCategory;

  /**
   * The Redis status code (error prefix) if this is a Redis ErrorReply.
   * Maps to OTel attribute: db.response.status_code
   * Examples: "ERR", "WRONGTYPE", "MOVED", "NOAUTH"
   */
  statusCode: string | undefined;
}

// Regex pattern for extracting Redis error prefixes
const REDIS_ERROR_PREFIX_REGEX = /^([A-Z][A-Z0-9_]*)\s/;

/**
 * Extracts the Redis status code (error prefix) from an ErrorReply.
 *
 * Redis errors follow the format "PREFIX message" where PREFIX is an uppercase
 * word like ERR, WRONGTYPE, MOVED, ASK, CLUSTERDOWN, NOSCRIPT, etc.
 *
 * @param error - The error to extract the status code from
 * @returns The error prefix (e.g., "ERR", "WRONGTYPE") or undefined if not an ErrorReply
 *          or if the message doesn't match the expected format
 */
function extractRedisStatusCode(error: Error): string | undefined {
  if (!(error instanceof ErrorReply)) {
    return undefined;
  }

  // Redis error messages start with an uppercase prefix followed by a space
  // Examples: "ERR unknown command", "WRONGTYPE Operation against a key...", "MOVED 3999 127.0.0.1:6381"
  const match = REDIS_ERROR_PREFIX_REGEX.exec(error.message);
  return match?.[1];
}

// Network error codes that indicate connection/network issues
const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'EPIPE',
  'ECONNABORTED',
  'EAI_AGAIN',
]);

// TLS-related error codes
const TLS_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_SIGNATURE_FAILURE',
  'ERR_SSL_WRONG_VERSION_NUMBER',
]);

// Redis error prefixes that indicate auth errors
const AUTH_ERROR_PREFIXES = new Set([
  'NOAUTH',
  'WRONGPASS',
  'NOPERM',
]);

// Redis error prefixes that indicate server errors
const SERVER_ERROR_PREFIXES = new Set([
  'ASK',
  'BUSY',
  'BUSYGROUP',
  'BUSYKEY',
  'CLUSTERDOWN',
  'CROSSSLOT',
  'DENIED',
  'ERR',
  'EXECABORT',
  'INPROG',
  'INVALIDOBJ',
  'IOERR',
  'LOADING',
  'MASTERDOWN',
  'MISCONF',
  'MOVED',
  'NOAUTH',
  'NOGROUP',
  'NOGOODSLAVE',
  'NOMASTERLINK',
  'NOPERM',
  'NOPROTO',
  'NOQUORUM',
  'NOREPLICAS',
  'NOSCRIPT',
  'NOTBUSY',
  'NOTREADY',
  'OOM',
  'READONLY',
  'TRYAGAIN',
  'UNBLOCKED',
  'UNKILLABLE',
  'WRONGPASS',
  'WRONGTYPE',
]);

/**
 * Checks if an error is a known node-redis network error type.
 */
function isNodeRedisNetworkError(error: Error): boolean {
  return (
    error instanceof ConnectionTimeoutError ||
    error instanceof SocketTimeoutError ||
    error instanceof SocketClosedUnexpectedlyError ||
    error instanceof SocketTimeoutDuringMaintenanceError ||
    error instanceof CommandTimeoutDuringMaintenanceError
  );
}

/**
 * Checks if a message contains TLS-related keywords.
 */
function isTlsErrorMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('certificate') ||
    lowerMessage.includes('handshake') ||
    lowerMessage.includes('ssl') ||
    lowerMessage.includes('tls')
  );
}

/**
 * Categorizes an Error based on its Redis error prefix.
 * Returns undefined if the error is not an ErrorReply or doesn't have a known prefix.
 */
function categorizeRedisError(error: Error): ErrorCategory | undefined {
  const prefix = extractRedisStatusCode(error);
  if (!prefix) {
    return undefined;
  }
  if (AUTH_ERROR_PREFIXES.has(prefix)) {
    return ERROR_CATEGORY.AUTH;
  }
  if (SERVER_ERROR_PREFIXES.has(prefix)) {
    return ERROR_CATEGORY.SERVER;
  }
  return undefined;
}

/**
 * Determines the error category for an Error.
 */
function getCategory(error: Error): ErrorCategory {
  // Check for known node-redis error types first
  if (isNodeRedisNetworkError(error)) {
    return ERROR_CATEGORY.NETWORK;
  }

  // Check error.code for network/TLS errors (Node.js system errors)
  const errorCode = (error as NodeJS.ErrnoException).code;
  if (errorCode) {
    if (NETWORK_ERROR_CODES.has(errorCode)) {
      return ERROR_CATEGORY.NETWORK;
    }
    if (TLS_ERROR_CODES.has(errorCode)) {
      return ERROR_CATEGORY.TLS;
    }
  }

  // Check for TLS errors by message patterns
  if (isTlsErrorMessage(error.message)) {
    return ERROR_CATEGORY.TLS;
  }

  // Check Redis error prefixes
  const category = categorizeRedisError(error);
  if (category) {
    return category;
  }

  return ERROR_CATEGORY.OTHER;
}

/**
 * Analyzes an error and extracts OpenTelemetry-relevant information.
 *
 * Returns an object with:
 * - errorType: The error class name (maps to error.type)
 * - category: network, tls, auth, server, or other (maps to redis.client.errors.category)
 * - statusCode: Redis error prefix like "ERR", "MOVED" (maps to db.response.status_code)
 *
 * Note: `redis.client.errors.internal` is NOT included here because it depends on
 * context (whether the error was handled internally or surfaced to the user),
 * which must be determined by the caller.
 *
 * @param error - The error to analyze (accepts unknown for safety)
 * @returns ErrorInfo object with all relevant error information
 */
export function getErrorInfo(error: unknown): ErrorInfo {
  // Handle non-Error values
  if (!(error instanceof Error)) {
    return {
      errorType: 'unknown',
      category: ERROR_CATEGORY.OTHER,
      statusCode: undefined,
    };
  }

  // Handle ReconnectStrategyError by unwrapping to original error
  const actualError = error instanceof ReconnectStrategyError
    ? error.originalError
    : error;

  return {
    errorType: actualError.constructor.name,
    category: getCategory(actualError),
    statusCode: extractRedisStatusCode(actualError),
  };
}

