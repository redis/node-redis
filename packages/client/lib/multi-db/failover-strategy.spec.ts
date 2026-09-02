import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { WeightBasedStrategy } from './failover-strategy';
import { Database } from './database';
import { Circuit } from './circuit';
import type { AnyRedisClientType } from '.';

const GRACE_PERIOD = 1000;

function createMember(id: string, weight: number) {
  let now = 0;
  const db = new Database({
    id,
    weight,
    client: new EventEmitter() as unknown as AnyRedisClientType,
    circuit: new Circuit({ gracePeriod: GRACE_PERIOD, numProbes: 1, clock: () => now })
  });
  return { db, advance: (ms: number) => { now += ms; } };
}

describe('WeightBasedStrategy', () => {
  const strategy = new WeightBasedStrategy();

  it('selects the highest-weight CLOSED member', () => {
    const a = createMember('a', 0.5);
    const b = createMember('b', 1);
    assert.equal(strategy.select([a.db, b.db]), b.db);
  });

  it('skips members with OPEN circuits', () => {
    const a = createMember('a', 0.5);
    const b = createMember('b', 1);
    b.db.circuit.open();
    assert.equal(strategy.select([a.db, b.db]), a.db);
  });

  it('skips HALF_OPEN members — only CLOSED circuits are eligible', () => {
    const a = createMember('a', 0.5);
    const b = createMember('b', 1);
    b.db.circuit.open();
    b.advance(GRACE_PERIOD);
    assert.equal(b.db.circuit.state, 'HALF_OPEN');
    assert.equal(strategy.select([a.db, b.db]), a.db);
  });

  it('breaks weight ties by member order', () => {
    const a = createMember('a', 1);
    const b = createMember('b', 1);
    assert.equal(strategy.select([a.db, b.db]), a.db);
  });

  it('returns undefined when no member is eligible', () => {
    const a = createMember('a', 1);
    a.db.circuit.open();
    assert.equal(strategy.select([a.db]), undefined);
    assert.equal(strategy.select([]), undefined);
  });
});
