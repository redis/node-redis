import { RedisArgument } from "../..";
import {
  ConnectionCloseReason,
  CscEvictionReason,
  CscResult,
  IOTelMetrics,
  IOTelPubSubMetrics,
  IOTelStreamMetrics,
  IOTelClientSideCacheMetrics,
  IOTelResiliencyMetrics,
  IOTelConnectionAdvancedMetrics,
  IOTelCommandMetrics,
  IOTelConnectionBasicMetrics,
  RecordClientErrorContext,
} from "./types";
import { noopFunction } from "./utils";

export class NoopCommandMetrics implements IOTelCommandMetrics {
  createRecordOperationDuration(
    _args: ReadonlyArray<RedisArgument>,
    _clientId?: string
  ): (error?: Error) => void {
    return noopFunction;
  }

  createRecordBatchOperationDuration(
    _operationName: 'MULTI' | 'PIPELINE',
    _clientId?: string
  ): (error?: Error) => void {
    return noopFunction;
  }
}

export class NoopConnectionBasicMetrics implements IOTelConnectionBasicMetrics {

  createRecordConnectionCreateTime(
    _clientId?: string
  ): () => void {
    return noopFunction;
  }

  recordConnectionCount(_value: number, _clientId?: string) {}

  recordConnectionRelaxedTimeout(
    _value: number,
    _clientId?: string
  ) {}

  recordConnectionHandoff(_clientId?: string) {}
}

export class NoopConnectionAdvancedMetrics implements IOTelConnectionAdvancedMetrics {

  recordConnectionClosed(
    _reason: ConnectionCloseReason,
    _clientId?: string
  ) {}

  createRecordConnectionWaitTime(
    _clientId?: string
  ): (clientId?: string) => void {
    return noopFunction;
  }
}

export class NoopResiliencyMetrics implements IOTelResiliencyMetrics {
  recordClientErrors(_context: RecordClientErrorContext) {}
  recordMaintenanceNotifications(
    _notification: string,
    _clientId?: string
  ) {}
}

export class NoopClientSideCacheMetrics implements IOTelClientSideCacheMetrics {
  recordCacheRequest(
    _result: CscResult,
    _clientId?: string
  ) {}


  recordCacheEviction(
    _reason: CscEvictionReason,
    _count?: number,
    _clientId?: string
  ) {}

  recordNetworkBytesSaved(
    _value: unknown,
    _clientId?: string
  ) {}
}

export class NoopPubSubMetrics implements IOTelPubSubMetrics {
  recordPubSubMessage(
    _direction: 'in' | 'out',
    _clientId: string,
    _channel?: RedisArgument,
    _sharded?: boolean,
  ) {}
}

export class NoopStreamMetrics implements IOTelStreamMetrics {
  recordStreamLag(
    _args: ReadonlyArray<RedisArgument>,
    _reply: unknown,
    _clientId?: string
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

  recordCommandReplyMetrics(
    _args: ReadonlyArray<RedisArgument>,
    _reply: unknown,
    _clientId: string,
  ) {}
}
