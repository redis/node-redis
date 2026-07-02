import { strict as assert } from 'node:assert';
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

  async function seedIndex(cluster: any) {
    await cluster.ft.create('idx', { n: 'NUMERIC' });
    const writes = [];
    for (let i = 0; i < DOC_COUNT; i++) {
      writes.push(cluster.hSet(`doc:${i}`, { n: i }));
    }
    await Promise.all(writes);
  }

  testUtils.testWithCluster('paginates a WITHCURSOR aggregate to completion (every page hits the same coordinator)', async cluster => {
    await seedIndex(cluster);

    const first = await cluster.ft.aggregateWithCursor('idx', '*', { COUNT: 5, LOAD: '@n' });
    assert.notEqual(first.cursor, 0, 'COUNT 5 over 40 docs should leave a live cursor');

    let rows = first.results.length;
    let cursor = first.cursor;
    // Each READ is keyless: if routing weren't sticky it would land on a random
    // node and throw "Cursor not found". Completing the loop proves stickiness.
    while (cursor !== 0) {
      const page = await cluster.ft.cursorRead('idx', cursor);
      rows += page.results.length;
      cursor = page.cursor;
    }

    assert.equal(rows, DOC_COUNT, 'all pages assembled without an unknown-cursor error');
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('FT.CURSOR DEL evicts the binding, so a later READ throws a client-side MISS', async cluster => {
    await seedIndex(cluster);

    const { cursor } = await cluster.ft.aggregateWithCursor('idx', '*', { COUNT: 5, LOAD: '@n' });
    assert.notEqual(cursor, 0);

    await cluster.ft.cursorDel('idx', cursor);
    await assert.rejects(
      cluster.ft.cursorRead('idx', cursor),
      /no known node for cursor/,
      'READ after DEL should MISS before any network call'
    );
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('a cursor created on one client instance is unusable on another (per-instance bindings)', async cluster => {
    await seedIndex(cluster);

    const { cursor } = await cluster.ft.aggregateWithCursor('idx', '*', { COUNT: 5, LOAD: '@n' });
    assert.notEqual(cursor, 0);

    const other = cluster.duplicate();
    await other.connect();
    try {
      await assert.rejects(
        other.ft.cursorRead('idx', cursor),
        /no known node for cursor/,
        'a second client has no binding for the first client\'s cursor'
      );
    } finally {
      other.destroy();
    }
  }, GLOBAL.CLUSTERS.OPEN);
});
