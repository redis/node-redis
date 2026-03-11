import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MERGE from './MERGE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CMS.MERGE', () => {
  describe('transformArguments', () => {
    it('without WEIGHTS', () => {
      assert.deepEqual(
        parseArgs(MERGE, 'destination', ['source']),
        ['CMS.MERGE', 'destination', '1', 'source']
      );
    });

    it('without WEIGHTS with Uint8Array sources', () => {
      // Regression: Uint8Array is a valid RedisArgument but was not matched by
      // the `instanceof Buffer` guard in isPlainSketches, causing it to fall
      // into the weighted branch and emit wrong arguments.
      const source = new TextEncoder().encode('source');
      assert.deepEqual(
        parseArgs(MERGE, 'destination', [source]),
        ['CMS.MERGE', 'destination', '1', source]
      );
    });

    it('with WEIGHTS', () => {
      assert.deepEqual(
        parseArgs(MERGE, 'destination', [{
          name: 'source',
          weight: 1
        }]),
        ['CMS.MERGE', 'destination', '1', 'source', 'WEIGHTS', '1']
      );
    });
  });

  testUtils.testWithClient('client.cms.merge', async client => {
    const [, , reply] = await Promise.all([
      client.cms.initByDim('source', 1000, 5),
      client.cms.initByDim('destination', 1000, 5),
      client.cms.merge('destination', ['source'])
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
