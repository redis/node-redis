import { RedisArgument } from "../..";
import {
  ConnectionCloseReason,
  CscEvictionReason,
  CscResult,
  OTelClientAttributes,
  IOTelMetrics,
} from "./types";
import { noopFunction } from "./utils";

export class NoopCommandMetrics {
  createRecordOperationDuration(
    _args: ReadonlyArray<RedisArgument>,
    _clientAttributes?: OTelClientAttributes
  ): (error?: Error) => void {
    return noopFunction;
  }

  createRecordBatchOperationDuration(
    _operationName: 'MULTI' | 'PIPELINE',
    _batchSize: number,
    _clientAttributes?: OTelClientAttributes
  ): (error?: Error) => void {
    return noopFunction;
  }
}

export class NoopConnectionBasicMetrics {
  recordConnectionCount(
    _value: number,
    _clientAttributes?: OTelClientAttributes
  ) {}

  createRecordConnectionCreateTime(
    _clientAttributes?: OTelClientAttributes
  ): () => void {
    return noopFunction;
  }

  recordConnectionRelaxedTimeout(
    _value: number,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordConnectionHandoff(_clientAttributes: OTelClientAttributes) {}
}

export class NoopConnectionAdvancedMetrics {
  recordPendingRequests(
    _value: number,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordConnectionClosed(
    _reason: ConnectionCloseReason,
    _clientAttributes?: OTelClientAttributes
  ) {}

  createRecordConnectionWaitTime(
    _clientAttributes?: OTelClientAttributes
  ): () => void {
    return noopFunction;
  }

  createRecordConnectionUseTime(
    _clientAttributes?: OTelClientAttributes
  ): () => void {
    return noopFunction;
  }
}

export class NoopResiliencyMetrics {
  recordClientErrors(
    _error: Error,
    _internal: boolean,
    _clientAttributes?: OTelClientAttributes,
    _retryAttempts?: number,
    _statusCode?: string
  ) {}
  recordMaintenanceNotifications(
    _notification: string,
    _clientAttributes?: OTelClientAttributes
  ) {}
}

export class NoopClientSideCacheMetrics {
  recordCacheRequest(
    _result: CscResult,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordCacheItemsChange(
    _delta: number,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordCacheEviction(
    _reason: CscEvictionReason,
    _count?: number,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordNetworkBytesSaved(
    _bytes: number,
    _clientAttributes?: OTelClientAttributes
  ) {}
}

export class NoopOTelMetrics implements IOTelMetrics {
  commandMetrics = new NoopCommandMetrics();
  connectionBasicMetrics = new NoopConnectionBasicMetrics();
  connectionAdvancedMetrics = new NoopConnectionAdvancedMetrics();
  resiliencyMetrics = new NoopResiliencyMetrics();
  clientSideCacheMetrics = new NoopClientSideCacheMetrics();
}
