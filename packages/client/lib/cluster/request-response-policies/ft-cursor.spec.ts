import { strict as assert } from 'node:assert';
import type { CommandParser } from '../../client/parser';
import { routeFtCursor, finalizeFtCursor, extractCursorValue } from './ft-cursor';

/**
 * Minimal stand-in for the cursor-relevant surface of `RedisClusterSlots`,
 * mirroring the token-keyed binding map, the token mint and the
 * address→client map so the router/finalize logic is exercised without
 * spinning a cluster.
 */
class FakeSlots {
  cursorBindings = new Map<string, { address: string; cursorId: string; createdAt: number; maxIdleMs?: number }>();
  clientsByAddress = new Map<string, object>();
  #seq = 0;

  mintCursorToken() { return String(++this.#seq); }
  bindCursor(token: string, binding: { address: string; cursorId: string; maxIdleMs?: number }) {
    this.cursorBindings.set(token, { ...binding, createdAt: 0 });
  }
  lookupCursor(token: string) { return this.cursorBindings.get(token); }
  evictCursor(token: string) { this.cursorBindings.delete(token); }
  async getMasterByAddress(address: string) { return this.clientsByAddress.get(address); }
  nodeAddressByClient(client: object) {
    for (const [address, c] of this.clientsByAddress) if (c === client) return address;
    return undefined;
  }
}

const parserOf = (...args: Array<string>) =>
  ({ redisArgs: args, commandIdentifier: { command: args[0], subcommand: args[1] } }) as unknown as CommandParser;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- routers/finalize run below the typed surface
const asSlots = (s: FakeSlots) => s as any;

describe('extractCursorValue', () => {
  it('reads the transformed-path `{ cursor }` object (RESP2 + RESP3)', () => {
    assert.equal(extractCursorValue({ total: 1, results: [], cursor: 42 }), 42);
  });

  it('reads raw RESP2 `[result, cursor]` at index 1', () => {
    assert.equal(extractCursorValue([['result'], 7]), 7);
  });

  it('reads raw RESP3 map key `cursor`', () => {
    assert.equal(extractCursorValue(new Map<string, unknown>([['results', []], ['cursor', 9]])), 9);
  });

  it('preserves a string cursor (NUMBER: String type mapping)', () => {
    assert.equal(extractCursorValue({ cursor: '12345678901234567890' }), '12345678901234567890');
  });

  it('returns undefined when there is no cursor (e.g. FT.CURSOR DEL "OK")', () => {
    assert.equal(extractCursorValue('OK'), undefined);
    assert.equal(extractCursorValue(null), undefined);
  });
});

describe('routeFtCursor', () => {
  it('pins the bound client and rewrites the token to the real cursor id', async () => {
    const slots = new FakeSlots();
    const client = { id: 'node-a' };
    slots.clientsByAddress.set('127.0.0.1:7000', client);
    slots.bindCursor('1', { address: '127.0.0.1:7000', cursorId: '18446744073709551615' });

    const plan = await routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '1'), undefined, undefined);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].client, client);
    assert.deepEqual(plan[0].parser!.redisArgs, ['FT.CURSOR', 'READ', 'idx', '18446744073709551615']);
  });

  it('throws on MISS (token never minted here)', async () => {
    const slots = new FakeSlots();
    await assert.rejects(
      routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '404'), undefined, undefined),
      /unknown cursor 404 on index "idx"/
    );
  });

  it('throws when the bound node is gone (getMasterByAddress → undefined)', async () => {
    const slots = new FakeSlots();
    slots.bindCursor('5', { address: '127.0.0.1:9999', cursorId: '5' }); // address not in clientsByAddress
    await assert.rejects(
      routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'DEL', 'idx', '5'), undefined, undefined),
      /left the cluster/
    );
  });
});

describe('finalizeFtCursor — FT.AGGREGATE', () => {
  it('mints a token, binds it to (address, real id) and rewrites the reply (RESP2 array)', () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);

    const reply = finalizeFtCursor(
      asSlots(slots),
      parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR'),
      [{ client } as never],
      [[], 55]
    );
    assert.deepEqual(reply, [[], 1]); // token 1 replaces the server id, numeric type kept
    assert.deepEqual(slots.lookupCursor('1'), {
      address: '10.0.0.1:6379', cursorId: '55', createdAt: 0, maxIdleMs: undefined
    });
  });

  it('rewrites the transformed `{ cursor }` reply and captures MAXIDLE', () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);

    const reply = finalizeFtCursor(
      asSlots(slots),
      parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR', 'MAXIDLE', '5000'),
      [{ client } as never],
      { total: 0, results: [], cursor: 88 }
    );
    assert.deepEqual(reply, { total: 0, results: [], cursor: 1 });
    assert.deepEqual(slots.lookupCursor('1'), {
      address: '10.0.0.1:6379', cursorId: '88', createdAt: 0, maxIdleMs: 5000
    });
  });

  it('rewrites a raw RESP3 Map reply without mutating the original', () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);
    const original = new Map<string, unknown>([['results', []], ['cursor', 66]]);

    const reply = finalizeFtCursor(
      asSlots(slots), parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR'), [{ client } as never], original
    ) as Map<string, unknown>;
    assert.equal(reply.get('cursor'), 1);
    assert.equal(original.get('cursor'), 66);
  });

  it('treats MAXIDLE 0 as "no idle limit" (server clamps it), not a 0ms TTL', () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);

    finalizeFtCursor(
      asSlots(slots),
      parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR', 'MAXIDLE', '0'),
      [{ client } as never],
      { cursor: 88 }
    );
    assert.equal(slots.lookupCursor('1')!.maxIdleMs, undefined);
  });

  it('does not bind or rewrite when the aggregate exhausts in one batch (cursor 0)', () => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);

    const reply = finalizeFtCursor(
      asSlots(slots), parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR'), [{ client } as never], { cursor: 0 }
    );
    assert.deepEqual(reply, { cursor: 0 });
    assert.equal(slots.cursorBindings.size, 0);
  });
});

describe('finalizeFtCursor — FT.CURSOR lifecycle', () => {
  const seed = (maxIdleMs?: number) => {
    const slots = new FakeSlots();
    const client = {};
    slots.clientsByAddress.set('10.0.0.1:6379', client);
    slots.bindCursor('7', { address: '10.0.0.1:6379', cursorId: '100', maxIdleMs });
    return { slots, client };
  };

  it('keeps the token stable across a READ and rewrites the reply back to it', () => {
    const { slots, client } = seed();
    const reply = finalizeFtCursor(
      asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '7'), [{ client } as never], { cursor: 100 }
    );
    assert.deepEqual(reply, { cursor: 7 });
    assert.deepEqual(slots.lookupCursor('7'), {
      address: '10.0.0.1:6379', cursorId: '100', createdAt: 0, maxIdleMs: undefined
    });
  });

  it('tracks a changed continuation id under the same token', () => {
    const { slots, client } = seed();
    const reply = finalizeFtCursor(
      asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '7'), [{ client } as never], { cursor: 200 }
    );
    assert.deepEqual(reply, { cursor: 7 });
    assert.equal(slots.lookupCursor('7')!.cursorId, '200');
  });

  it('preserves MAXIDLE across READ rebinds', () => {
    const { slots, client } = seed(600_000);
    finalizeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '7'), [{ client } as never], { cursor: 200 });
    assert.equal(slots.lookupCursor('7')!.maxIdleMs, 600_000);
  });

  it('evicts on READ → cursor 0 and passes the server 0 through (ends the loop)', () => {
    const { slots, client } = seed();
    const reply = finalizeFtCursor(
      asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '7'), [{ client } as never], { cursor: 0 }
    );
    assert.deepEqual(reply, { cursor: 0 });
    assert.equal(slots.lookupCursor('7'), undefined);
  });

  it('evicts on DEL regardless of reply, then a follow-up READ MISSes', async () => {
    const { slots, client } = seed();
    finalizeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'DEL', 'idx', '7'), [{ client } as never], 'OK');
    assert.equal(slots.lookupCursor('7'), undefined);
    await assert.rejects(routeFtCursor(asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', '7'), undefined, undefined));
  });
});

describe('cross-shard cursor-id collision', () => {
  it('two shards minting the same real id for one index get distinct tokens and route independently', async () => {
    const slots = new FakeSlots();
    const clientA = { id: 'a' }, clientB = { id: 'b' };
    slots.clientsByAddress.set('a:1', clientA);
    slots.clientsByAddress.set('b:1', clientB);

    // Both aggregates return server cursor 42 for the same index.
    const replyA = finalizeFtCursor(
      asSlots(slots), parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR'), [{ client: clientA } as never], { cursor: 42 }
    ) as { cursor: number };
    const replyB = finalizeFtCursor(
      asSlots(slots), parserOf('FT.AGGREGATE', 'idx', '*', 'WITHCURSOR'), [{ client: clientB } as never], { cursor: 42 }
    ) as { cursor: number };

    assert.notEqual(replyA.cursor, replyB.cursor);

    const planA = await routeFtCursor(
      asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', String(replyA.cursor)), undefined, undefined
    );
    const planB = await routeFtCursor(
      asSlots(slots), parserOf('FT.CURSOR', 'READ', 'idx', String(replyB.cursor)), undefined, undefined
    );
    assert.equal(planA[0].client, clientA);
    assert.equal(planB[0].client, clientB);
    assert.deepEqual(planA[0].parser!.redisArgs, ['FT.CURSOR', 'READ', 'idx', '42']);
    assert.deepEqual(planB[0].parser!.redisArgs, ['FT.CURSOR', 'READ', 'idx', '42']);
  });
});
