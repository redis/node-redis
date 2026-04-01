import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SINTERSTORE from './SINTERSTORE';
import { parseArgs } from './generic-transformers';

describe('SINTERSTORE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SINTERSTORE, 'destination', 'key'),
        ['SINTERSTORE', 'destination', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SINTERSTORE, 'destination', ['1', '2']),
        ['SINTERSTORE', 'destination', '1', '2']
      );
    });
  });

  testUtils.testAll('sInterStore', async client => {
    assert.equal(
      await client.sInterStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  // TODO: re-enable once cluster CI flakiness is resolved
  // testUtils.testAll('sInterStore with multiple sets', async client => {
  //   await Promise.all([
  //     client.sAdd('{tag}key1', ['a', 'b', 'c']),
  //     client.sAdd('{tag}key2', ['b', 'c', 'd']),
  //     client.sAdd('{tag}key3', ['c', 'd', 'e'])
  //   ]);
  //
  //   const reply = await client.sInterStore('{tag}destination', ['{tag}key1', '{tag}key2', '{tag}key3']);
  //
  //   assert.equal(typeof reply, 'number');
  //   assert.equal(reply, 1);
  // }, {
  //   client: GLOBAL.SERVERS.OPEN,
  //   cluster: GLOBAL.CLUSTERS.OPEN
  // });
});
