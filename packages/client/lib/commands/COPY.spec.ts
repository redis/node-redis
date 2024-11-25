import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COPY from './COPY';
import { parseArgs } from './generic-transformers';

describe('COPY', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(COPY, 'source', 'destination'),
        ['COPY', 'source', 'destination']
      );
    });

    it('with destination DB flag', () => {
      assert.deepEqual(
        parseArgs(COPY, 'source', 'destination', {
          DB: 1
        }),
        ['COPY', 'source', 'destination', 'DB', '1']
      );
    });

    it('with replace flag', () => {
      assert.deepEqual(
        parseArgs(COPY, 'source', 'destination', {
          REPLACE: true
        }),
        ['COPY', 'source', 'destination', 'REPLACE']
      );
    });

    it('with both flags', () => {
      assert.deepEqual(
        parseArgs(COPY, 'source', 'destination', {
          DB: 1,
          REPLACE: true
        }),
        ['COPY', 'source', 'destination', 'DB', '1', 'REPLACE']
      );
    });
  });

  testUtils.testAll('copy', async client => {
    assert.equal(
      await client.copy('{tag}source', '{tag}destination'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
