import type { HealthCheck, HealthCheckTarget } from './health-check';

/** @experimental */
export interface LagAwareHealthCheckOptions {
  /**
   * Redis Enterprise REST API origin (e.g. `https://cluster1.example:9443`) —
   * not the database endpoint. A resolver receives the database id, for
   * members living on different clusters.
   */
  restEndpoint: string | ((databaseId: string) => string);
  /**
   * The database's uid in the REST API. A resolver receives the database id.
   */
  bdbUid: string | number | ((databaseId: string) => string | number);
  /** REST API basic-auth credentials. */
  credentials?: {
    username: string;
    password: string;
  };
  /** tolerated replication lag in ms. Default 5000. */
  lagTolerance?: number;
  /** ms budget for one REST request; an overrun fails the probe. Default 3000. */
  requestTimeout?: number;
  /**
   * Merged into every `fetch` call — the escape hatch for custom TLS (pass an
   * undici `dispatcher` with your CA) or extra headers. `method`, the
   * basic-auth header and the timeout signal are owned by the check.
   */
  requestOptions?: RequestInit;
  /**
   * Called with every probe failure's underlying error (network failure,
   * timeout, endpoint/URL misconfiguration) before the probe reports
   * unhealthy. Without it a permanently misconfigured check is
   * indistinguishable from an unhealthy database — the member just keeps
   * reporting unhealthy with no diagnostics. The callback must not throw.
   */
  onProbeError?: (error: unknown, databaseId: string) => void;
}

/**
 * Redis Enterprise availability check: probes the cluster REST API's database
 * availability endpoint with lag verification instead of the data path — a
 * member whose replication lag exceeds `lagTolerance` reports unhealthy even
 * while it still answers commands. A non-2xx response, network failure or
 * timeout fails the probe.
 * @experimental
 */
export class LagAwareHealthCheck implements HealthCheck {
  readonly #restEndpoint: LagAwareHealthCheckOptions['restEndpoint'];
  readonly #bdbUid: LagAwareHealthCheckOptions['bdbUid'];
  readonly #lagTolerance: number;
  readonly #requestTimeout: number;
  readonly #requestOptions?: RequestInit;
  readonly #authorization?: string;
  readonly #onProbeError?: (error: unknown, databaseId: string) => void;

  constructor(options: LagAwareHealthCheckOptions) {
    this.#restEndpoint = options.restEndpoint;
    this.#bdbUid = options.bdbUid;
    this.#lagTolerance = options.lagTolerance ?? 5000;
    this.#requestTimeout = options.requestTimeout ?? 3000;
    this.#requestOptions = options.requestOptions;
    this.#onProbeError = options.onProbeError;
    if (options.credentials) {
      const { username, password } = options.credentials;
      this.#authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }
  }

  async probe(target: HealthCheckTarget): Promise<boolean> {
    try {
      const endpoint = typeof this.#restEndpoint === 'function'
        ? this.#restEndpoint(target.id)
        : this.#restEndpoint;
      const uid = typeof this.#bdbUid === 'function'
        ? this.#bdbUid(target.id)
        : this.#bdbUid;

      // inside the try: a bad endpoint (URL parse) or a throwing resolver is a
      // probe failure the onProbeError callback must see, not an escaped throw
      const url = new URL(`/v1/bdbs/${uid}/availability`, endpoint);
      url.searchParams.set('extend_check', 'lag');
      url.searchParams.set('availability_lag_tolerance_ms', String(this.#lagTolerance));

      const response = await fetch(url, {
        ...this.#requestOptions,
        method: 'GET',
        headers: {
          ...(this.#requestOptions?.headers as Record<string, string> | undefined),
          ...(this.#authorization ? { authorization: this.#authorization } : {})
        },
        signal: AbortSignal.timeout(this.#requestTimeout)
      });
      // availability is the status code alone; the body carries no further
      // signal — but it must be drained, or undici holds the connection until
      // GC (one leaked socket per probe, every interval, forever)
      await response.body?.cancel();
      return response.ok;
    } catch (err) {
      this.#onProbeError?.(err, target.id);
      return false;
    }
  }
}
