import type { AnyRedisClientType } from './index';
import type { Circuit } from './circuit';

export type DatabaseRole = 'ACTIVE' | 'PASSIVE' | 'DISCONNECTED';

/**
 * One member database: the underlying client bound to its stable id, weight,
 * circuit and role. Implementation lands with the foundational phase (T008).
 */
export interface DatabaseOptions<C extends AnyRedisClientType> {
  id: string;
  client: C;
  weight: number;
  circuit: Circuit;
  skipInitialHealthCheck?: boolean;
}

export class Database<C extends AnyRedisClientType> {
  declare readonly id: string;
  declare readonly client: C;
  declare weight: number;
  declare readonly circuit: Circuit;
  declare role: DatabaseRole;
}
