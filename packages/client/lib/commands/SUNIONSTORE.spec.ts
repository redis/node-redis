import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUNIONSTORE from './SUNIONSTORE';
import { parseArgs } from './generic-transformers';

describe('SUNIONSTORE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SUNIONSTORE, 'destination', 'key'),
        ['SUNIONSTORE', 'destination', 'key']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SUNIONSTORE, 'destination', ['1', '2']),
        ['SUNIONSTORE', 'destination', '1', '2']
      );
    });
  });

  testUtils.testAll('sUnionStore', async client => {
    assert.equal(
      await client.sUnionStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('sUnionStore with data', async client => {
    await client.sAdd('{tag}set1', ['a', 'b', 'c']);
    await client.sAdd('{tag}set2', ['c', 'd', 'e']);

    const reply = await client.sUnionStore('{tag}destination', ['{tag}set1', '{tag}set2']);

    assert.strictEqual(typeof reply, 'number');
    assert.strictEqual(reply, 5);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
