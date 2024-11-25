import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SORT from './SORT';
import { parseArgs } from './generic-transformers';

describe('SORT', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(SORT, 'key'),
        ['SORT', 'key']
      );
    });

    it('with BY', () => {
      assert.deepEqual(
        parseArgs(SORT, 'key', {
          BY: 'pattern'
        }),
        ['SORT', 'key', 'BY', 'pattern']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(SORT, 'key', {
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['SORT', 'key', 'LIMIT', '0', '1']
      );
    });

    describe('with GET', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(SORT, 'key', {
            GET: 'pattern'
          }),
          ['SORT', 'key', 'GET', 'pattern']
        );
      });

      it('array', () => {
        assert.deepEqual(
          parseArgs(SORT, 'key', {
            GET: ['1', '2']
          }),
          ['SORT', 'key', 'GET', '1', 'GET', '2']
        );
      });
    });

    it('with DIRECTION', () => {
      assert.deepEqual(
        parseArgs(SORT, 'key', {
          DIRECTION: 'ASC'
        }),
        ['SORT', 'key', 'ASC']
      );
    });

    it('with ALPHA', () => {
      assert.deepEqual(
        parseArgs(SORT, 'key', {
          ALPHA: true
        }),
        ['SORT', 'key', 'ALPHA']
      );
    });

    it('with BY, LIMIT, GET, DIRECTION, ALPHA', () => {
      assert.deepEqual(
        parseArgs(SORT, 'key', {
          BY: 'pattern',
          LIMIT: {
            offset: 0,
            count: 1
          },
          GET: 'pattern',
          DIRECTION: 'ASC',
          ALPHA: true
        }),
        ['SORT', 'key', 'BY', 'pattern', 'LIMIT', '0', '1', 'GET', 'pattern', 'ASC', 'ALPHA']
      );
    });
  });

  testUtils.testAll('sort', async client => {
    assert.deepEqual(
      await client.sort('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
