import { strict as assert } from 'node:assert';
import type { CommandParser } from '../../client/parser';
import { routeScan, finalizeScanCursor } from './scan-cursor';

/**
 * Minimal stand-in for the scan-chain surface of `RedisClusterSlots` (see
 * ft-cursor.spec.ts for the same pattern), with an ordered master list so the
 * node-advance logic is exercised without spinning a cluster.
 */
class FakeSlots {
  scanCursors = new Map<string, { address: string; cursor: string; visited: Set<string>; createdAt: number }>();
  clientsByAddress = new Map<string, object>();
  masterOrder: Array<string> = [];
  #seq = 0;

  mintCursorToken() { return String(++this.#seq); }
  bindScanCursor(token: string, address: string, cursor: string, visited: Set<string>) {
    this.scanCursors.set(token, { address, cursor, visited, createdAt: 0 });
  }
  lookupScanCursor(token: string) { return this.scanCursors.get(token); }
  evictScanCursor(token: string) { this.scanCursors.delete(token); }
  nextScanTarget(visited: ReadonlySet<string>) {
    return this.masterOrder.find(address => !visited.has(address));
  }
  async getMasterByAddress(address: string) { return this.clientsByAddress.get(address); }
  nodeAddressByClient(client: object) {
    for (const [address, c] of this.clientsByAddress) if (c === client) return address;
    return undefined;
  }

  addMaster(address: string) {
    const client = { id: address };
    this.masterOrder.push(address);
    this.clientsByAddress.set(address, client);
    return client;
  }
}

const parserOf = (...args: Array<string>) =>
  ({ redisArgs: args, commandIdentifier: { command: args[0], subcommand: args[1] } }) as unknown as CommandParser;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- routers/finalizers run below the typed surface
const asSlots = (s: FakeSlots) => s as any;

describe('routeScan', () => {
  it('SCAN 0 starts on the first master', async () => {
    const slots = new FakeSlots();
    const a = slots.addMaster('a:1');
    slots.addMaster('b:1');

    const plan = await routeScan(asSlots(slots), parserOf('SCAN', '0'), undefined, undefined);
    assert.deepEqual(plan, [{ client: a }]);
  });

  it('throws when there are no masters', async () => {
    const slots = new FakeSlots();
    await assert.rejects(
      routeScan(asSlots(slots), parserOf('SCAN', '0'), undefined, undefined),
      /no master nodes available/
    );
  });

  it('routes a known token to its bound node with the real cursor substituted', async () => {
    const slots = new FakeSlots();
    slots.addMaster('a:1');
    const b = slots.addMaster('b:1');
    slots.bindScanCursor('7', 'b:1', '42', new Set(['a:1']));

    const plan = await routeScan(
      asSlots(slots), parserOf('SCAN', '7', 'MATCH', 'user:*', 'COUNT', '100'), undefined, undefined
    );
    assert.equal(plan.length, 1);
    assert.equal(plan[0].client, b);
    assert.deepEqual(plan[0].parser!.redisArgs, ['SCAN', '42', 'MATCH', 'user:*', 'COUNT', '100']);
  });

  it('throws on an unknown cursor token', async () => {
    const slots = new FakeSlots();
    slots.addMaster('a:1');
    await assert.rejects(
      routeScan(asSlots(slots), parserOf('SCAN', '999'), undefined, undefined),
      /unknown cursor "999".*restart the scan from 0/s
    );
  });

  it('throws when the bound node has left the cluster', async () => {
    const slots = new FakeSlots();
    slots.addMaster('a:1');
    slots.bindScanCursor('7', 'gone:1', '42', new Set());
    await assert.rejects(
      routeScan(asSlots(slots), parserOf('SCAN', '7'), undefined, undefined),
      /left the cluster/
    );
  });
});

describe('finalizeScanCursor', () => {
  it('walks a full two-master chain end to end (typed `{ cursor, keys }` reply)', () => {
    const slots = new FakeSlots();
    const a = slots.addMaster('a:1');
    const b = slots.addMaster('b:1');

    // SCAN 0 on node a → mid-node cursor: token minted, reply cursor swapped.
    let reply = finalizeScanCursor(
      asSlots(slots), parserOf('SCAN', '0'), [{ client: a }], { cursor: '5', keys: ['k1'] }
    ) as { cursor: string; keys: Array<string> };
    assert.equal(reply.cursor, '1');
    assert.deepEqual(reply.keys, ['k1']);
    assert.deepEqual(slots.lookupScanCursor('1'), { address: 'a:1', cursor: '5', visited: new Set(), createdAt: 0 });

    // node a exhausts → chain advances to node b with a fresh cursor 0.
    reply = finalizeScanCursor(
      asSlots(slots), parserOf('SCAN', '1'), [{ client: a }], { cursor: '0', keys: ['k2'] }
    ) as { cursor: string; keys: Array<string> };
    assert.equal(reply.cursor, '1');
    assert.deepEqual(slots.lookupScanCursor('1'), { address: 'b:1', cursor: '0', visited: new Set(['a:1']), createdAt: 0 });

    // node b exhausts, no unvisited masters left → caller sees "0", entry evicted.
    reply = finalizeScanCursor(
      asSlots(slots), parserOf('SCAN', '1'), [{ client: b }], { cursor: '0', keys: ['k3'] }
    ) as { cursor: string; keys: Array<string> };
    assert.equal(reply.cursor, '0');
    assert.equal(slots.scanCursors.size, 0);
  });

  it('finishes immediately on a single-master cluster (no token minted)', () => {
    const slots = new FakeSlots();
    const a = slots.addMaster('a:1');

    const reply = finalizeScanCursor(
      asSlots(slots), parserOf('SCAN', '0'), [{ client: a }], { cursor: '0', keys: [] }
    ) as { cursor: string };
    assert.equal(reply.cursor, '0');
    assert.equal(slots.scanCursors.size, 0);
  });

  it('rewrites the raw `[cursor, keys]` reply shape at index 0', () => {
    const slots = new FakeSlots();
    const a = slots.addMaster('a:1');
    slots.addMaster('b:1');

    const reply = finalizeScanCursor(
      asSlots(slots), parserOf('SCAN', '0'), [{ client: a }], ['17', ['k1', 'k2']]
    ) as [string, Array<string>];
    assert.deepEqual(reply, ['1', ['k1', 'k2']]);
    assert.equal(slots.lookupScanCursor('1')!.cursor, '17');
  });

  it('keeps the cursor a Buffer under a Buffer type mapping', () => {
    const slots = new FakeSlots();
    const a = slots.addMaster('a:1');
    slots.addMaster('b:1');

    const reply = finalizeScanCursor(
      asSlots(slots), parserOf('SCAN', '0'), [{ client: a }], { cursor: Buffer.from('17'), keys: [] }
    ) as { cursor: Buffer };
    assert.ok(reply.cursor instanceof Buffer);
    assert.equal(reply.cursor.toString(), '1');
  });

  it('ignores non-SCAN commands and unknown reply shapes', () => {
    const slots = new FakeSlots();
    const a = slots.addMaster('a:1');

    const getReply = 'value';
    assert.equal(finalizeScanCursor(asSlots(slots), parserOf('GET', 'k'), [{ client: a }], getReply), getReply);

    const weird = { notACursor: true };
    assert.equal(finalizeScanCursor(asSlots(slots), parserOf('SCAN', '0'), [{ client: a }], weird), weird);
    assert.equal(slots.scanCursors.size, 0);
  });

  it('leaves the reply untouched when the serving node cannot be resolved', () => {
    const slots = new FakeSlots();
    slots.addMaster('a:1');
    const stranger = {};

    const reply = { cursor: '5', keys: [] };
    assert.equal(finalizeScanCursor(asSlots(slots), parserOf('SCAN', '0'), [{ client: stranger }], reply), reply);
    assert.equal(slots.scanCursors.size, 0);
  });

  it('two interleaved scans keep independent chains', () => {
    const slots = new FakeSlots();
    const a = slots.addMaster('a:1');
    slots.addMaster('b:1');

    const r1 = finalizeScanCursor(asSlots(slots), parserOf('SCAN', '0'), [{ client: a }], { cursor: '5', keys: [] }) as { cursor: string };
    const r2 = finalizeScanCursor(asSlots(slots), parserOf('SCAN', '0'), [{ client: a }], { cursor: '9', keys: [] }) as { cursor: string };
    assert.notEqual(r1.cursor, r2.cursor);
    assert.equal(slots.lookupScanCursor(r1.cursor)!.cursor, '5');
    assert.equal(slots.lookupScanCursor(r2.cursor)!.cursor, '9');
  });
});
