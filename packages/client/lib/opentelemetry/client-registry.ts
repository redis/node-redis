import { ClientIdentity } from '../client/identity';
import { OTelClientAttributes } from './types';

/**
 * Handle representing a client for metrics collection.
 * Each registered client provides this interface to expose its identity and attributes.
 */
export interface ClientMetricsHandle {
  /**
   * The client's identity (id, role, parentId).
   */
  readonly identity: ClientIdentity;

  /**
   * Returns the current client attributes (host, port, db).
   * Called dynamically to get up-to-date values.
   */
  getAttributes(): OTelClientAttributes;

  /**
   * Returns the current number of pending requests (commands waiting to write + waiting for reply).
   */
  getPendingRequests(): number;

  /**
   * Returns the current number of items in the client-side cache.
   * Returns 0 if client-side caching is not enabled.
   */
  getCacheItemCount(): number;

  /**
   * Returns whether the client has an active connection.
   * Used to determine if metrics should be recorded for this client.
   */
  isConnected(): boolean;
}

/**
 * Registry interface for tracking Redis clients.
 * Used by observable gauge callbacks to iterate over all registered clients.
 */
export interface IClientRegistry {
  /**
   * Register a client for metrics tracking.
   */
  register(handle: ClientMetricsHandle): void;

  /**
   * Unregister a client by its ID.
   */
  unregister(clientId: string): void;

  /**
   * Get all registered client handles.
   */
  getAll(): Iterable<ClientMetricsHandle>;
}

/**
 * No-op implementation of the client registry.
 * Used when OpenTelemetry is not initialized to avoid overhead.
 */
class NoOpClientRegistry implements IClientRegistry {
  register(_handle: ClientMetricsHandle): void {
    // No-op
  }

  unregister(_clientId: string): void {
    // No-op
  }

  getAll(): Iterable<ClientMetricsHandle> {
    return [];
  }
}

/**
 * Real implementation of the client registry.
 * Tracks all registered clients in a Map keyed by client ID.
 */
class ClientRegistryImpl implements IClientRegistry {
  readonly #clients = new Map<string, ClientMetricsHandle>();

  register(handle: ClientMetricsHandle): void {
    this.#clients.set(handle.identity.id, handle);
  }

  unregister(clientId: string): void {
    this.#clients.delete(clientId);
  }

  getAll(): Iterable<ClientMetricsHandle> {
    return this.#clients.values();
  }
}

/**
 * Singleton manager for the client registry.
 * Starts with a NoOp registry and can be initialized to use the real implementation.
 */
export class ClientRegistry {
  static #instance: IClientRegistry = new NoOpClientRegistry();
  static #initialized = false;

  private constructor() {}

  /**
   * Initialize the client registry with the real implementation.
   * Should be called from OpenTelemetry.init().
   */
  static init(): void {
    if (ClientRegistry.#initialized) {
      return;
    }

    ClientRegistry.#instance = new ClientRegistryImpl();
    ClientRegistry.#initialized = true;
  }

  /**
   * Get the current registry instance.
   * Returns NoOp registry if not initialized, real registry otherwise.
   */
  static get instance(): IClientRegistry {
    return ClientRegistry.#instance;
  }

  /**
   * Check if the registry has been initialized.
   */
  static isInitialized(): boolean {
    return ClientRegistry.#initialized;
  }

  /**
   * Reset the registry to its initial state (NoOp).
   * Only for testing purposes.
   * @internal
   */
  static reset(): void {
    ClientRegistry.#instance = new NoOpClientRegistry();
    ClientRegistry.#initialized = false;
  }
}

