import type { AnyRedisClientType } from './index';

/**
 * Owns the underlying member clients and the active selection; orchestrates
 * switches. Internal — reached only through the factories and the controller.
 */
export class MultiDbManager<C extends AnyRedisClientType> {
  readonly clients: ReadonlyArray<C>;
  active: C;

  constructor(clients: Array<C>) {
    this.clients = clients;
    this.active = clients[0]; // failover selection stubbed
  }

  async connect(): Promise<void> {
    await Promise.all(this.clients.map(c => c.connect()));
  }

  async close(): Promise<void> {
    await Promise.all(this.clients.map(c => c.close()));
  }

  destroy(): void {
    for (const c of this.clients) c.destroy();
  }

  async quit(): Promise<void> {
    // no per-DB quit fan-out subtleties for the sketch; treat like close
    await this.close();
  }
}
