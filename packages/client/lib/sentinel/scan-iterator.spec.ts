import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('RedisSentinel scanIterator', () => {
  for (const testOptions of [GLOBAL.SENTINEL.OPEN, GLOBAL.SENTINEL.PASSWORD]) {
    const passIndex = testOptions.serverArguments.indexOf('--requirepass') + 1;
    const password = passIndex === 0 ? undefined : testOptions.serverArguments[passIndex];

    describe(`test with password - ${password}`, () => {
      testUtils.testWithClientSentinel('scanIterator', async sentinel => {
        await Promise.all([
          sentinel.set('scan:1', '1'),
          sentinel.set('scan:2', '2')
        ]);

        const results = new Set<string>();
        for await (const keys of sentinel.scanIterator({ MATCH: 'scan:*', COUNT: 1 })) {
          for (const key of keys) {
            results.add(key);
          }
        }

        assert.deepEqual(results, new Set(['scan:1', 'scan:2']));
      }, testOptions);

      testUtils.testWithClientSentinel('leased client scanIterator', async sentinel => {
        await Promise.all([
          sentinel.set('lease-scan:1', '1'),
          sentinel.set('lease-scan:2', '2')
        ]);

        const client = await sentinel.acquire();
        try {
          const results = new Set<string>();
          for await (const keys of client.scanIterator({ MATCH: 'lease-scan:*', COUNT: 1 })) {
            for (const key of keys) {
              results.add(key);
            }
          }

          assert.deepEqual(results, new Set(['lease-scan:1', 'lease-scan:2']));
        } finally {
          const release = client.release();
          if (release) await release;
        }
      }, testOptions);
    });
  }

  testUtils.testWithClientSentinel('scanIterator releases master lease before yielding', async sentinel => {
    await sentinel.set('scan-deadlock:1', '1');

    let didScan = false;
    for await (const keys of sentinel.scanIterator({ MATCH: 'scan-deadlock:*', COUNT: 1 })) {
      didScan = true;
      assert.ok(keys.length > 0);
      await sentinel.set('scan-deadlock:seen', '1');
    }

    assert.equal(didScan, true);
    assert.equal(await sentinel.get('scan-deadlock:seen'), '1');
  }, GLOBAL.SENTINEL.WITH_REPLICA_POOL_SIZE_1);
});
