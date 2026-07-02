import { strict as assert } from 'node:assert';
import type { CommandParser } from '../../client/parser';
import { routeFtCursor, captureCursorBinding, extractCursorId } from './ft-cursor';

/**
 * Minimal stand-in for the cursor-relevant surface of `RedisClusterSlots`,
 * mirroring the real `${index}:${cursorId}` keying and address→client map so
 * the router/capture logic is exercised without spinning a cluster.
 */
class FakeSlots {
  cursorBindings = new Map<string, { address: string; createdAt: number; maxIdleMs?: number }>();
  clientsByAddress = new Map<string, object>();

  #key(index: string, cursorId: number) { return `${index}:${cursorId}`; }
  bindCursor(index: string, cursorId: number, address: string, maxIdleMs?: number) {
    this.cursorBindings.set(this.#key(index, cursorId), { address, createdAt: 0, maxIdleMs });
  }
  lookupCursor(index: string, cursorId: number) { return this.cursorBindings.get(this.#key(index, cursorId)); }
  evictCursor(index: string, cursorId: number) { this.cursorBindings.delete(this.#key(index, cursorId)); }
  async getMasterByAddress(address: string) { return this.clientsByAddress.get(address); }
  nodeAddressByClient(client: object) {
    for (const [address, c] of this.clientsByAddress) if (c === client) return address;
    return undefined;
  }
}

const parserOf = (...args: Array<string>) =>
  ({ redisArgs: args, commandIdentifier: { command: args[0], subcommand: args[1] } }) as unknown as CommandParser;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- routers/capture run below the typed surface
const asSlots = (s: FakeSlots) => s as any;

describe('extractCursorId', () => {
  it('reads the transformed-path `{ cursor }` object (RESP2 + RESP3)', () => {
    assert.equal(extractCursorId({ total: 1, results: [], cursor: 42 }), 42);
  });

  it('reads raw RESP2 `[result, cursor]` at index 1', () => {
    assert.equal(extractCursorId([['result'], 7]), 7);
  });

  it('reads raw RESP3 map key `cursor`', () => {
    assert.equal(extractCursorId(new Map<string, unknown>([['results', []], ['cursor', 9]])), 9);
  });

  it('returns undefined when there is no cursor (e.g. FT.CURSOR DEL "OK")', () => {
    assert.equal(extractCursorId('OK'), undefined);
    assert.equal(extractCursorId(null), undefined);
  });
});

describe('routeFtCursor', () => {
  it('pins the bound client on HIT', async () => {
    const slots = new FakeSlots();
    const client = { id: 'node-a' };
    slots.clientsByAddress.set('127.0.0.1:7000', client);
    slots.bindCursor('idx', 123, '127.0.0.1:7000');

    const plan = await routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '123'), undefined, undefined);
    assert.deepEqual(plan, [{ client }]);
  });

  it('throws on MISS (cursor never bound)', async () => {
    const slots = new FakeSlots();
    await assert.rejects(
      routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '404'), undefined, undefined),
      /no known node for cursor 404 on index "idx"/
    );
  });

  it('throws when the bound node is gone (getMasterByAddress → undefined)', async () => {
    const slots = new FakeSlots();
    slots.bindCursor('idx', 5, '127.0.0.1:9999'); // address not in clientsByAddress
    await assert.rejects(
      routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'DEL', 'idx', '5'), undefined, undefined),
      /left the cluster/
    );
  });
});

describe('captureCursorBinding — FT.AGGREGATE', () => {
  it('binds (index, cursor) → serving node address (RESP2 array reply)', () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);

    captureCursorBinding(asSlots(slots), parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR'), [{ client } as any], [[], 55]);
    assert.deepEqual(slots.lookupCursor('idx', 55), { address: '10.0.0.1:6379', createdAt: 0, maxIdleMs: undefined });
  });

  it('binds from the transformed `{ cursor }` reply and captures MAXIDLE', () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);

    captureCursorBinding(
      asSlots(slots),
      parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR', 'MAXIDLE', '5000'),
      [{ client } as any],
      { total: 0, results: [], cursor: 88 }
    );
    assert.deepEqual(slots.lookupCursor('idx', 88), { address: '10.0.0.1:6379', createdAt: 0, maxIdleMs: 5000 });
  });

  it('does not bind when the aggregate exhausts in one batch (cursor 0)', () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);

    captureCursorBinding(asSlots(slots), parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR'), [{ client } as any], { cursor: 0 });
    assert.equal(slots.cursorBindings.size, 0);
  });
});

describe('captureCursorBinding — FT.CURSOR lifecycle', () => {
  const seed = () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);
    slots.bindCursor('idx', 100, '10.0.0.1:6379');
    return { slots, client };
  };

  it('rebinds a continuation cursor (evict old, bind new, same address)', () => {
    const { slots, client } = seed();
    captureCursorBinding(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '100'), [{ client } as any], { cursor: 200 });
    assert.equal(slots.lookupCursor('idx', 100), undefined);
    assert.deepEqual(slots.lookupCursor('idx', 200), { address: '10.0.0.1:6379', createdAt: 0, maxIdleMs: undefined });
  });

  it('evicts on READ → cursor 0 (exhausted)', () => {
    const { slots, client } = seed();
    captureCursorBinding(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '100'), [{ client } as any], { cursor: 0 });
    assert.equal(slots.lookupCursor('idx', 100), undefined);
  });

  it('keeps the binding when the continuation id is unchanged', () => {
    const { slots, client } = seed();
    captureCursorBinding(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '100'), [{ client } as any], { cursor: 100 });
    assert.deepEqual(slots.lookupCursor('idx', 100), { address: '10.0.0.1:6379', createdAt: 0, maxIdleMs: undefined });
  });

  it('evicts on DEL regardless of reply, then a follow-up READ MISSes', async () => {
    const { slots, client } = seed();
    captureCursorBinding(asSlots(slots), parserOf('FT.CURSOR', 'DEL', 'idx', '100'), [{ client } as any], 'OK');
    assert.equal(slots.lookupCursor('idx', 100), undefined);
    await assert.rejects(routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '100'), undefined, undefined));
  });
});

describe('cursor-id collision across indexes', () => {
  it('keys on (index, cursorId) so same id under two indexes routes independently', async () => {
    const slots = new FakeSlots();
    const clientA = { id: 'a' }, clientB = { id: 'b' };
    slots.clientsByAddress.set('a:1', clientA);
    slots.clientsByAddress.set('b:1', clientB);
    slots.bindCursor('idxA', 1, 'a:1');
    slots.bindCursor('idxB', 1, 'b:1');

    assert.deepEqual(await routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idxA', '1'), undefined, undefined), [{ client: clientA }]);
    assert.deepEqual(await routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idxB', '1'), undefined, undefined), [{ client: clientB }]);
  });
});
