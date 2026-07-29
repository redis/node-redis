import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import testUtils, { GLOBAL } from '../test-utils';
import { AbortError } from '../errors';

/**
 * Integration tests for the HIMPORT transparency layer (`#executeHimport` +
 * `FieldsetRegistry`/`PreparedFieldsets`): lazy prepare, lazy discard reconcile,
 * registry-based replies, and the recover-and-retry-once net.
 */
describe('HIMPORT transparency layer', () => {
  testUtils.isVersionGreaterThanHook([8, 10]);

  // Force a disconnect and wait for the socket error — the next command reconnects.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function killClient(client: any): Promise<void> {
    const onceErrorPromise = once(client, 'error');
    await client.sendCommand(['QUIT']);
    await Promise.all([
      onceErrorPromise,
      assert.rejects(client.ping())
    ]);
  }

  testUtils.testWithClient('lazily re-prepares after a reconnect', async client => {
    await client.hImportPrepare('fs', ['f1', 'f2']);
    await killClient(client);

    // The new session has no fieldsets; the hook must pipeline a PREPARE in front.
    assert.equal(await client.hImportSet('key', 'fs', ['v1', 'v2']), 'OK');
    assert.deepEqual(await client.hGetAll('key'), { f1: 'v1', f2: 'v2' });
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('re-prepares when the field list changes (version staleness)', async client => {
    await client.hImportPrepare('fs', ['old1', 'old2']);
    await client.hImportSet('key1', 'fs', ['v1', 'v2']);

    await client.hImportPrepare('fs', ['new1', 'new2']);
    await client.hImportSet('key2', 'fs', ['v1', 'v2']);

    assert.deepEqual(await client.hGetAll('key2'), { new1: 'v1', new2: 'v2' });
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('lazily re-prepares after a typed reset()', async client => {
    await client.hImportPrepare('fs', ['f1']);
    await client.reset();

    assert.equal(await client.hImportSet('key', 'fs', ['v1']), 'OK');
    assert.deepEqual(await client.hGetAll('key'), { f1: 'v1' });
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('discard stops lazy prepare; the server error propagates', async client => {
    await client.hImportPrepare('fs', ['f1']);
    assert.equal(await client.hImportDiscard('fs'), 1);

    await assert.rejects(
      client.hImportSet('key', 'fs', ['v1']),
      /no such fieldset/
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('asap SET reaches the wire behind its injected PREPARE', async client => {
    await client.hImportPrepare('fs', ['f1']);
    // Fresh socket, empty session — the injection must unshift IN FRONT of the asap SET;
    // same-order enqueue would put the SET first and fail with `no such fieldset`.
    await killClient(client);

    assert.equal(await client.asap().hImportSet('key', 'fs', ['v1']), 'OK');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('rejected user PREPARE removes the registration', async client => {
    await assert.rejects(
      client.hImportPrepare('fs', ['dup', 'dup']),
      /duplicate field name/
    );

    // No lazy-prepare retry loop: the registration is gone, the server error propagates.
    await assert.rejects(
      client.hImportSet('key', 'fs', ['v1', 'v2']),
      /no such fieldset/
    );

    // A corrected PREPARE registers fresh.
    await client.hImportPrepare('fs', ['f1', 'f2']);
    assert.equal(await client.hImportSet('key', 'fs', ['v1', 'v2']), 'OK');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('rejected replacement PREPARE keeps the prior registration', async client => {
    await client.hImportPrepare('fs', ['f1', 'f2']);
    assert.equal(await client.hImportSet('key1', 'fs', ['v1', 'v2']), 'OK');

    // Re-prepare an already-registered fieldset with an invalid (duplicate) field list. The
    // server rejects it and keeps the existing fieldset, so the client must NOT drop the
    // still-valid registration.
    await assert.rejects(
      client.hImportPrepare('fs', ['dup', 'dup']),
      /duplicate field name/
    );

    // Fresh session (empty server-side) so the SET can only succeed by lazy-preparing from a
    // surviving registry entry — proving the prior registration was restored, not discarded.
    await killClient(client);
    assert.equal(await client.hImportSet('key2', 'fs', ['v1', 'v2']), 'OK');
    assert.deepEqual(await client.hGetAll('key2'), { f1: 'v1', f2: 'v2' });
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('pre-enqueue DISCARD failure keeps the registration', async client => {
    await client.hImportPrepare('fs', ['f1']);
    assert.equal(await client.hImportSet('key1', 'fs', ['v1']), 'OK');

    // An already-aborted signal rejects the DISCARD before it reaches the wire — the server
    // never saw it, so the discard must be fully rolled back (registry entry re-added).
    const ac = new AbortController();
    ac.abort();
    await assert.rejects(
      client.withAbortSignal(ac.signal).hImportDiscard('fs'),
      AbortError
    );

    // The registration survives, so the fieldset still resolves.
    assert.equal(await client.hImportSet('key2', 'fs', ['v1']), 'OK');
    assert.equal(await client.hGet('key2', 'f1'), 'v1');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('retries once when the session lost its state unobserved', async client => {
    await client.hImportPrepare('fs', ['f1']);
    await client.hImportSet('key1', 'fs', ['v1']);

    // Raw RESET bypasses the typed reset() wipe: the server session is gone but the
    // client still claims the fieldset is prepared — exactly the lie the
    // recover-and-retry-once net exists to absorb.
    await client.sendCommand(['RESET']);

    assert.equal(await client.hImportSet('key2', 'fs', ['v1']), 'OK');
    // hGet, not hGetAll: raw RESET also reverted the connection protocol to RESP2, so
    // map-shaped replies would decode flat; a bulk string is identical in both protocols.
    assert.equal(await client.hGet('key2', 'f1'), 'v1');
  }, GLOBAL.SERVERS.OPEN);

  describe('user discard failure recovery', () => {
    // Reject the first matching HIMPORT wire command instead of sending it — simulates a
    // server-side failure while the connection (and its session fieldsets) stays alive.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function failNextWireCommand(client: any, subcommand: string): void {
      // The hook sends through `_self`, not the `Object.create` proxy the test holds.
      const self = client._self;
      const original = self.sendCommand.bind(self);
      self.sendCommand = (args: Array<string>, opts?: unknown) => {
        if (String(args[0]) === 'HIMPORT' && String(args[1]) === subcommand) {
          self.sendCommand = original;
          return Promise.reject(new Error('simulated HIMPORT failure'));
        }
        return original(args, opts);
      };
    }

    testUtils.testWithClient('failed user DISCARD is replayed before the next dependent command', async client => {
      await client.hImportPrepare('fs', ['f1']);
      assert.equal(await client.hImportSet('key1', 'fs', ['v1']), 'OK');

      failNextWireCommand(client, 'DISCARD');
      await assert.rejects(client.hImportDiscard('fs'), /simulated HIMPORT failure/);

      // The session still holds the fieldset server-side; the rollback must leave a trace
      // that makes the reconcile replay the discard before this SET reaches the wire — a
      // success here would be a silent write through a discarded template.
      await assert.rejects(
        client.hImportSet('key2', 'fs', ['v1']),
        /no such fieldset/
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('failed user DISCARDALL is replayed before the next dependent command', async client => {
      await client.hImportPrepare('fs1', ['f1']);
      await client.hImportPrepare('fs2', ['f2']);
      assert.equal(await client.hImportSet('key1', 'fs1', ['v1']), 'OK');

      failNextWireCommand(client, 'DISCARDALL');
      await assert.rejects(client.hImportDiscardAll(), /simulated HIMPORT failure/);

      // Both sessions claims were wiped optimistically; the rollback restores them so the
      // reconcile (collapsed back to one DISCARDALL) wipes the server session for real.
      await assert.rejects(client.hImportSet('key2', 'fs1', ['v1']), /no such fieldset/);
      await assert.rejects(client.hImportSet('key3', 'fs2', ['v1']), /no such fieldset/);
    }, GLOBAL.SERVERS.OPEN);
  });

  describe('MULTI/pipeline guard', () => {
    testUtils.testWithClient('rejects session subcommands inside MULTI', async client => {
      for (const build of [
        () => client.multi().hImportPrepare('fs', ['f1']),
        () => client.multi().hImportDiscard('fs'),
        () => client.multi().hImportDiscardAll(),
        () => client.multi().addCommand(['HIMPORT', 'PREPARE', 'fs', 'f1'])
      ]) {
        await assert.rejects(
          build().exec(),
          /not supported inside MULTI\/pipeline/
        );
      }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('allows hImportSet inside MULTI after an out-of-band prepare', async client => {
      await client.hImportPrepare('fs', ['f1']);
      // Same connection: prepare above already prepared this session.
      const replies = await client.multi()
        .hImportSet('key', 'fs', ['v1'])
        .exec();

      assert.deepEqual(replies, ['OK']);
      assert.deepEqual(await client.hGetAll('key'), { f1: 'v1' });
    }, GLOBAL.SERVERS.OPEN);
  });

  describe('pool', () => {
    testUtils.testWithClientPool('each borrowed connection lazily self-prepares', async pool => {
      await pool.hImportPrepare('fs', ['f1', 'f2']);

      // Concurrent SETs spread across pooled connections; each one must transparently
      // prepare its own session on first use.
      const keys = ['key1', 'key2', 'key3', 'key4', 'key5', 'key6'];
      const replies = await Promise.all(
        keys.map(key => pool.hImportSet(key, 'fs', ['v1', 'v2']))
      );
      assert.deepEqual(replies, keys.map(() => 'OK'));

      assert.deepEqual(await pool.hGetAll('key6'), { f1: 'v1', f2: 'v2' });
    }, {
      ...GLOBAL.SERVERS.OPEN,
      poolOptions: { minimum: 3 }
    });

    testUtils.testWithClientPool('re-prepare with changed fields reaches every connection', async pool => {
      await pool.hImportPrepare('fs', ['old1', 'old2']);
      await Promise.all(
        ['a1', 'a2', 'a3', 'a4'].map(key => pool.hImportSet(key, 'fs', ['v1', 'v2']))
      );

      await pool.hImportPrepare('fs', ['new1', 'new2']);
      const keys = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'];
      await Promise.all(keys.map(key => pool.hImportSet(key, 'fs', ['v1', 'v2'])));

      for (const key of keys) {
        assert.deepEqual(await pool.hGetAll(key), { new1: 'v1', new2: 'v2' });
      }
    }, {
      ...GLOBAL.SERVERS.OPEN,
      poolOptions: { minimum: 3 }
    });

    testUtils.testWithClientPool('discard is coherent across connections (lazy reconcile)', async pool => {
      await pool.hImportPrepare('fs', ['f1', 'f2']);
      // Spread lazy prepares across connections so several sessions hold the fieldset.
      await Promise.all(
        ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map(key => pool.hImportSet(key, 'fs', ['v1', 'v2']))
      );

      // Registry-based reply: 1 regardless of which connection the DISCARD borrows.
      assert.equal(await pool.hImportDiscard('fs'), 1);
      assert.equal(await pool.hImportDiscard('fs'), 0);

      // No stale-SET success on ANY connection: sessions still holding the fieldset must
      // reconcile the discard before the SET reaches the wire.
      for (const key of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']) {
        await assert.rejects(
          pool.hImportSet(key, 'fs', ['v1', 'v2']),
          /no such fieldset/
        );
      }
    }, {
      ...GLOBAL.SERVERS.OPEN,
      poolOptions: { minimum: 3 }
    });
  });

  describe('cluster', () => {
    testUtils.testWithCluster('SETs route by slot with per-node lazy prepare; discardAll is registry-based', async cluster => {
      assert.equal(await cluster.hImportPrepare('fs', ['f1', 'f2']), 'OK');

      // Keys hashing to different slots — each SET routes to its own master.
      const keys = ['key:{1}', 'key:{2}', 'key:{3}', 'key:{4}', 'key:{5}'];
      const replies = await Promise.all(
        keys.map(key => cluster.hImportSet(key, 'fs', ['v1', 'v2']))
      );
      assert.deepEqual(replies, keys.map(() => 'OK'));
      assert.deepEqual(await cluster.hGetAll('key:{3}'), { f1: 'v1', f2: 'v2' });

      // Registry-based reply: exactly 1 registered fieldset removed — not a per-master
      // sum, not a session count.
      assert.equal(await cluster.hImportDiscardAll(), 1);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('duplicate() shares HIMPORT registrations', async cluster => {
      await cluster.hImportPrepare('fs', ['f1', 'f2']);

      // A duplicate made after PREPARE shares the parent's registry (matching the standalone
      // duplicate-sharing guarantee), so a direct SET lazy-prepares from it per node.
      const dup = await cluster.duplicate().connect();
      try {
        assert.equal(await dup.hImportSet('key:{1}', 'fs', ['v1', 'v2']), 'OK');
        assert.deepEqual(await dup.hGetAll('key:{1}'), { f1: 'v1', f2: 'v2' });
      } finally {
        await dup.close();
      }
    }, GLOBAL.CLUSTERS.OPEN);
  });
});
