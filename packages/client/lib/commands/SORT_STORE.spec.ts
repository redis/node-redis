import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SORT_STORE from './SORT_STORE';
import { parseArgs } from './generic-transformers';

describe('SORT STORE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(SORT_STORE, 'source', 'destination'),
        ['SORT', 'source', 'STORE', 'destination']
      );
    });

    it('with BY', () => {
      assert.deepEqual(
        parseArgs(SORT_STORE, 'source', 'destination', {
          BY: 'pattern'
        }),
        ['SORT', 'source', 'BY', 'pattern', 'STORE', 'destination']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(SORT_STORE, 'source', 'destination', {
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['SORT', 'source', 'LIMIT', '0', '1', 'STORE', 'destination']
      );
    });

    describe('with GET', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(SORT_STORE, 'source', 'destination', {
            GET: 'pattern'
          }),
          ['SORT', 'source', 'GET', 'pattern', 'STORE', 'destination']
        );
      });

      it('array', () => {
        assert.deepEqual(
          parseArgs(SORT_STORE, 'source', 'destination', {
            GET: ['1', '2']
          }),
          ['SORT', 'source', 'GET', '1', 'GET', '2', 'STORE', 'destination']
        );
      });
    });

    it('with DIRECTION', () => {
      assert.deepEqual(
        parseArgs(SORT_STORE, 'source', 'destination', {
          DIRECTION: 'ASC'
        }),
        ['SORT', 'source', 'ASC', 'STORE', 'destination']
      );
    });

    it('with ALPHA', () => {
      assert.deepEqual(
        parseArgs(SORT_STORE, 'source', 'destination', {
          ALPHA: true
        }),
        ['SORT', 'source', 'ALPHA', 'STORE', 'destination']
      );
    });

    it('with BY, LIMIT, GET, DIRECTION, ALPHA', () => {
      assert.deepEqual(
        parseArgs(SORT_STORE, 'source', 'destination', {
          BY: 'pattern',
          LIMIT: {
            offset: 0,
            count: 1
          },
          GET: 'pattern',
          DIRECTION: 'ASC',
          ALPHA: true
        }),
        ['SORT', 'source', 'BY', 'pattern', 'LIMIT', '0', '1', 'GET', 'pattern', 'ASC', 'ALPHA', 'STORE', 'destination']
      );
    });
  });

  testUtils.testAll('sortStore', async client => {
    assert.equal(
      await client.sortStore('{tag}source', '{tag}destination'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
