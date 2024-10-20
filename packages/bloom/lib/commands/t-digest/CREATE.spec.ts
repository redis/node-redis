import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import CREATE from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.CREATE', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key'),
        ['TDIGEST.CREATE', 'key']
      );
    });

    it('with COMPRESSION', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'key', {
          COMPRESSION: 100
        }),
        ['TDIGEST.CREATE', 'key', 'COMPRESSION', '100']
      );
    });
  });

  testUtils.testWithClient('client.tDigest.create', async client => {
    assert.equal(
      await client.tDigest.create('key'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
