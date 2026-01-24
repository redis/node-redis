import { RedisArgument } from "../..";
import { ReplyUnion } from "../RESP/types";
import {
  ConnectionCloseReason,
  CscEvictionReason,
  CscResult,
  OTelClientAttributes,
  IOTelMetrics,
  IOTelPubSubMetrics,
  IOTelStreamMetrics,
  IOTelClientSideCacheMetrics,
  IOTelResiliencyMetrics,
  IOTelConnectionAdvancedMetrics,
  IOTelCommandMetrics,
  IOTelConnectionBasicMetrics,
} from "./types";
import { noopFunction } from "./utils";

export class NoopCommandMetrics implements IOTelCommandMetrics {
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

export class NoopConnectionBasicMetrics implements IOTelConnectionBasicMetrics {
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

export class NoopConnectionAdvancedMetrics implements IOTelConnectionAdvancedMetrics {
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

export class NoopResiliencyMetrics implements IOTelResiliencyMetrics {
  recordClientErrors(
    _error: Error,
    _internal: boolean,
    _clientAttributes?: OTelClientAttributes,
    _retryAttempts?: number,
  ) {}
  recordMaintenanceNotifications(
    _notification: string,
    _clientAttributes?: OTelClientAttributes
  ) {}
}

export class NoopClientSideCacheMetrics implements IOTelClientSideCacheMetrics {
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

export class NoopPubSubMetrics implements IOTelPubSubMetrics {
  recordPubSubMessage(
    _direction: 'in' | 'out',
    _channel?: RedisArgument,
    _sharded?: boolean,
    _clientAttributes?: OTelClientAttributes
  ) {}
}

export class NoopStreamMetrics implements IOTelStreamMetrics {
  recordStreamLag(
    _args: ReadonlyArray<RedisArgument>,
    _reply: ReplyUnion,
    _clientAttributes?: OTelClientAttributes
  ) {}
}

export class NoopOTelMetrics implements IOTelMetrics {
  commandMetrics = new NoopCommandMetrics();
  connectionBasicMetrics = new NoopConnectionBasicMetrics();
  connectionAdvancedMetrics = new NoopConnectionAdvancedMetrics();
  resiliencyMetrics = new NoopResiliencyMetrics();
  clientSideCacheMetrics = new NoopClientSideCacheMetrics();
  pubSubMetrics = new NoopPubSubMetrics();
  streamMetrics = new NoopStreamMetrics();
}
