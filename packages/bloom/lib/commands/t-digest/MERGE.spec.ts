import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MERGE from './MERGE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TDIGEST.MERGE', () => {
  describe('transformArguments', () => {
    describe('source', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(MERGE, 'destination', 'source'),
          ['TDIGEST.MERGE', 'destination', '1', 'source']
        );
      });

      it('Array', () => {
        assert.deepEqual(
          parseArgs(MERGE, 'destination', ['1', '2']),
          ['TDIGEST.MERGE', 'destination', '2', '1', '2']
        );
      });
    });

    it('with COMPRESSION', () => {
      assert.deepEqual(
        parseArgs(MERGE, 'destination', 'source', {
          COMPRESSION: 100
        }),
        ['TDIGEST.MERGE', 'destination', '1', 'source', 'COMPRESSION', '100']
      );
    });

    it('with OVERRIDE', () => {
      assert.deepEqual(
        parseArgs(MERGE, 'destination', 'source', {
          OVERRIDE: true
        }),
        ['TDIGEST.MERGE', 'destination', '1', 'source', 'OVERRIDE']
      );
    });
  });

  testUtils.testWithClient('client.tDigest.merge', async client => {
    const [, reply] = await Promise.all([
      client.tDigest.create('source'),
      client.tDigest.merge('destination', 'source')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
