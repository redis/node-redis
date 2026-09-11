import type { CircuitState } from './circuit';
import type { DatabaseRole } from './database';

/**
 * Read-only view of one member as a failover strategy sees it: identity,
 * selection weight, role, and the circuit state — no raw client, no circuit
 * mutators. The manager passes its live member objects (they satisfy this
 * view); a strategy must return one of the candidates it was given, not a
 * copy.
 * @experimental
 */
export interface FailoverCandidate {
  readonly id: string;
  readonly weight: number;
  readonly role: DatabaseRole;
  readonly circuit: { readonly state: CircuitState };
}

/**
 * Picks the next active member during failover/fallback. Receives the full
 * member set; implementations must return only a candidate whose circuit is
 * CLOSED — and always one of the GIVEN candidates (identity, never a copy).
 * Returning `undefined` means no candidate exists and the caller escalates.
 * @experimental
 */
export interface FailoverStrategy {
  select(databases: ReadonlyArray<FailoverCandidate>): FailoverCandidate | undefined;
}

/**
 * Default strategy: the highest-weight member with a CLOSED circuit; ties are
 * broken by member order (earlier wins — strict `>` keeps the first).
 * @experimental
 */
export class WeightBasedStrategy implements FailoverStrategy {
  select(databases: ReadonlyArray<FailoverCandidate>): FailoverCandidate | undefined {
    let best: FailoverCandidate | undefined;
    for (const db of databases) {
      if (db.circuit.state !== 'CLOSED') continue;
      if (!best || db.weight > best.weight) {
        best = db;
      }
    }
    return best;
  }
}
