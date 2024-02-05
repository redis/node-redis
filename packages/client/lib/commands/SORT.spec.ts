import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SORT from './SORT';

describe('SORT', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        SORT.transformArguments('key'),
        ['SORT', 'key']
      );
    });

    it('with BY', () => {
      assert.deepEqual(
        SORT.transformArguments('key', {
          BY: 'pattern'
        }),
        ['SORT', 'key', 'BY', 'pattern']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        SORT.transformArguments('key', {
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
          SORT.transformArguments('key', {
            GET: 'pattern'
          }),
          ['SORT', 'key', 'GET', 'pattern']
        );
      });

      it('array', () => {
        assert.deepEqual(
          SORT.transformArguments('key', {
            GET: ['1', '2']
          }),
          ['SORT', 'key', 'GET', '1', 'GET', '2']
        );
      });
    });

    it('with DIRECTION', () => {
      assert.deepEqual(
        SORT.transformArguments('key', {
          DIRECTION: 'ASC'
        }),
        ['SORT', 'key', 'ASC']
      );
    });

    it('with ALPHA', () => {
      assert.deepEqual(
        SORT.transformArguments('key', {
          ALPHA: true
        }),
        ['SORT', 'key', 'ALPHA']
      );
    });

    it('with BY, LIMIT, GET, DIRECTION, ALPHA', () => {
      assert.deepEqual(
        SORT.transformArguments('key', {
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
