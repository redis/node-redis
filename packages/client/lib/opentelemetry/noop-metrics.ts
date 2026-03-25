import { IOTelMetrics } from "./types";

export class NoopOTelMetrics implements IOTelMetrics {
  commandMetrics = { destroy() {} };
}
