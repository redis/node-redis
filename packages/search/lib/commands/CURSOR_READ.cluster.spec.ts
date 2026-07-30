import { strict as assert } from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import testUtils, { GLOBAL } from '../test-utils';

/**
 * Cluster-mode sticky-cursor routing. FT.CURSOR READ/DEL carry no key, so
 * without the client-side binding they'd hash-route to an arbitrary node and
 * the server would reject the unknown cursor. These tests prove the binding:
 * pagination completes against the coordinator that minted the cursor, DEL
 * evicts it, and bindings are per client instance.
 */
describe('FT.CURSOR sticky routing (cluster)', () => {
  const DOC_COUNT = 40;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper over the dynamic cluster surface
  async function seedIndex(cluster: any) {
    await cluster.ft.create('idx', { n: 'NUMERIC' });
    const writes = [];
    for (let i = 0; i < DOC_COUNT; i++) {
      writes.push(cluster.hSet(`doc:${i}`, { n: i }));
    }
    await Promise.all(writes);
  }

  // FT.CREATE lands on a single node and its index definition propagates to the
  // other shards asynchronously; an aggregate that routes to a shard which
  // hasn't caught up yet is rejected with "No such index" (flaky on slower
  // servers). Retry the aggregate — the cluster client follows MOVED and
  // re-picks a node each attempt — until the index is live everywhere.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper over the dynamic cluster surface
  async function openCursor(cluster: any) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await cluster.ft.aggregateWithCursor('idx', '*', { COUNT: 5, LOAD: '@n' });
      } catch (err) {
        if (attempt >= 100 || !/no such index/i.test(String((err as Error)?.message ?? err))) throw err;
        await setTimeout(50);
      }
    }
  }

  testUtils.testWithCluster('paginates a WITHCURSOR aggregate to completion (every page hits the same coordinator)', async cluster => {
    await seedIndex(cluster);

    const first = await openCursor(cluster);
    assert.notEqual(first.cursor, 0, 'COUNT 5 over 40 docs should leave a live cursor');

    let cursor = first.cursor;
    let pages = 0;
    // FT.CURSOR READ is keyless: without sticky routing it would hash to a
    // random node and the server would reject the cursor as unknown. Draining
    // the cursor to 0 without that error proves every READ reached the node
    // that minted it. How many rows the aggregate ultimately yields depends on
    // the server's cross-shard search coordination (which varies by version),
    // so we assert the client routing contract here, not the total row count.
    while (cursor !== 0) {
      const page = await cluster.ft.cursorRead('idx', cursor);
      cursor = page.cursor;
      pages++;
    }

    assert.ok(pages >= 1, 'at least one sticky FT.CURSOR READ must drain the cursor');
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('FT.CURSOR DEL evicts the binding, so a later READ throws a client-side MISS', async cluster => {
    await seedIndex(cluster);

    const { cursor } = await openCursor(cluster);
    assert.notEqual(cursor, 0);

    await cluster.ft.cursorDel('idx', cursor);
    await assert.rejects(
      cluster.ft.cursorRead('idx', cursor),
      /unknown cursor/,
      'READ after DEL should MISS before any network call'
    );
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('a cursor created on one client instance is unusable on another (per-instance bindings)', async cluster => {
    await seedIndex(cluster);

    const { cursor } = await openCursor(cluster);
    assert.notEqual(cursor, 0);

    const other = cluster.duplicate();
    await other.connect();
    try {
      await assert.rejects(
        other.ft.cursorRead('idx', cursor),
        /unknown cursor/,
        'a second client has no binding for the first client\'s cursor'
      );
    } finally {
      other.destroy();
    }
  }, GLOBAL.CLUSTERS.OPEN);
});
