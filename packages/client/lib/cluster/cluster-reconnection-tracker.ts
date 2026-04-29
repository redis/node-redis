import type { ClusterTopologyRefreshOnReconnectionAttempt } from './index';

/**
 * Tracks which cluster node clients are currently reconnecting and decides when
 * to trigger a cluster topology refresh based on a configurable strategy.
 *
 * The strategy can be:
 * - `undefined` - uses the default delay (5 seconds)
 * - `false` or `0` - disables topology refresh on reconnection
 * - a positive integer - delay in ms after the first reconnection attempt before refreshing
 * - a function - custom logic receiving the set of reconnecting addresses and the timestamp
 *   of the first reconnection attempt, returning a delay or `false`/`undefined` to skip
 *
 * After the delay elapses, {@link onReconnectionAttempt} returns `true` once to signal
 * that a refresh should be scheduled, then resets the timer.
 */
export default class ClusterReconnectionTracker {
  /** Default delay (ms) before triggering a topology refresh after reconnection starts */
  static #DEFAULT_TOPOLOGY_REFRESH_ON_RECONNECTION_ATTEMPT = 5_000;

  readonly #strategy?: ClusterTopologyRefreshOnReconnectionAttempt;
  /** Maps client ID to its node address for clients currently in a reconnecting state */
  readonly #reconnectingClients = new Map<string, string>();
  /** Timestamp of the first reconnection attempt in the current reconnection cycle */
  #firstReconnectionAt?: number;

  /**
   * Validates that a strategy value is acceptable before use.
   * @throws If the strategy is not supported
   */
  static validate(strategy?: ClusterTopologyRefreshOnReconnectionAttempt) {
    if (
      strategy === undefined ||
      strategy === false ||
      typeof strategy === 'function' ||
      (
        typeof strategy === 'number' &&
        Number.isInteger(strategy) &&
        strategy >= 0
      )
    ) {
      return;
    }

    throw new TypeError('topologyRefreshOnReconnectionAttempt must be undefined, false, a non-negative integer, or a function');
  }

  constructor(strategy?: ClusterTopologyRefreshOnReconnectionAttempt) {
    ClusterReconnectionTracker.validate(strategy);
    this.#strategy = strategy;
  }

  get reconnectingAddresses() {
    return new Set(this.#reconnectingClients.values());
  }

  get firstReconnectionAt() {
    return this.#firstReconnectionAt;
  }

  /**
   * Records a reconnection attempt for the given client and evaluates whether
   * the configured delay has elapsed since the first attempt in this cycle.
   *
   * @returns `true` if a topology refresh should be triggered, `false` otherwise
   * @throws If a user-supplied strategy function returns an invalid value
   */
  onReconnectionAttempt(clientId: string, address: string, now = Date.now()) {
    if (this.#strategy === false || this.#strategy === 0) {
      return false;
    }

    this.#reconnectingClients.set(clientId, address);
    this.#firstReconnectionAt ??= now;

    const delay = this.#getDelay(this.reconnectingAddresses, this.#firstReconnectionAt);
    if (delay === undefined || now - this.#firstReconnectionAt < delay) {
      return false;
    }

    this.#firstReconnectionAt = now;
    return true;
  }

  /** Removes a client from tracking (e.g. when it reconnects successfully or disconnects) */
  removeClient(clientId: string) {
    if (!this.#reconnectingClients.delete(clientId)) return;

    this.#clearTimestampIfClean();
  }

  /** Removes all clients associated with a node address (e.g. when the node is removed from the topology) */
  removeAddress(address: string) {
    for (const [clientId, reconnectingAddress] of this.#reconnectingClients.entries()) {
      if (reconnectingAddress === address) {
        this.#reconnectingClients.delete(clientId);
      }
    }

    this.#clearTimestampIfClean();
  }

  /** Resets all tracking state (e.g. on cluster disconnect or destroy) */
  clear() {
    this.#reconnectingClients.clear();
    this.#firstReconnectionAt = undefined;
  }

  /**
   * Evaluates the configured strategy to determine the delay before a topology refresh.
   * @returns The delay in ms, or `undefined` if no refresh should occur
   */
  #getDelay(reconnectingAddresses: ReadonlySet<string>, firstReconnectionAt: number) {
    if (this.#strategy === undefined) {
      return ClusterReconnectionTracker.#DEFAULT_TOPOLOGY_REFRESH_ON_RECONNECTION_ATTEMPT;
    }

    if (this.#strategy === false) {
      return;
    }

    if (typeof this.#strategy === 'number') {
      return this.#strategy;
    }

    const delay = this.#strategy(reconnectingAddresses, firstReconnectionAt);
    if (delay === false || delay === undefined || delay === 0) return;

    if (!Number.isInteger(delay) || delay < 0) {
      throw new TypeError(`topologyRefreshOnReconnectionAttempt should return \`false | undefined | number\`, got ${delay} instead`);
    }

    return delay;
  }

  #clearTimestampIfClean() {
    if (this.#reconnectingClients.size === 0) {
      this.#firstReconnectionAt = undefined;
    }
  }
}
