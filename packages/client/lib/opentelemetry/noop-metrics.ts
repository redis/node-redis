import { RedisArgument } from "../..";
import { MetricErrorType, OTelClientAttributes, IOTelMetrics } from "./types";
import { noopFunction } from "./utils";

export class NoopOTelMetrics implements IOTelMetrics {
  createRecordOperationDuration(
    _args: ReadonlyArray<RedisArgument>,
    _clientAttributes?: OTelClientAttributes
  ): (error?: Error) => void {
    return noopFunction;
  }

  recordConnectionCount(
    _value: number,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordConnectionCreateTime(
    _durationMs: number,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordConnectionRelaxedTimeout(
    _value: number,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordConnectionHandoff(_clientAttributes: OTelClientAttributes) {}

  recordClientErrorsHandled(
    _type: MetricErrorType,
    _clientAttributes?: OTelClientAttributes
  ) {}

  recordMaintenanceNotifications(_clientAttributes: OTelClientAttributes) {}

  recordPendingRequests(
    _value: number,
    _clientAttributes?: OTelClientAttributes
  ) {}
}
