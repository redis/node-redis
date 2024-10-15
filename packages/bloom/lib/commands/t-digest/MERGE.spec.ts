import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MERGE from './MERGE';

describe('TDIGEST.MERGE', () => {
  describe('transformArguments', () => {
    describe('source', () => {
      it('string', () => {
        assert.deepEqual(
          MERGE.transformArguments('destination', 'source'),
          ['TDIGEST.MERGE', 'destination', '1', 'source']
        );
      });

      it('Array', () => {
        assert.deepEqual(
          MERGE.transformArguments('destination', ['1', '2']),
          ['TDIGEST.MERGE', 'destination', '2', '1', '2']
        );
      });
    });

    it('with COMPRESSION', () => {
      assert.deepEqual(
        MERGE.transformArguments('destination', 'source', {
          COMPRESSION: 100
        }),
        ['TDIGEST.MERGE', 'destination', '1', 'source', 'COMPRESSION', '100']
      );
    });

    it('with OVERRIDE', () => {
      assert.deepEqual(
        MERGE.transformArguments('destination', 'source', {
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
