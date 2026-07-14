import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, BLOCKING_MIN_VALUE } from '../test-utils';
import BLMOVEM from './BLMOVEM';
import { parseArgs } from './generic-transformers';

describe('BLMOVEM', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(BLMOVEM, 'source', 'destination', 'LEFT', 'RIGHT', 0),
        ['BLMOVEM', 'source', 'destination', 'LEFT', 'RIGHT', '0']
      );
    });

    it('with COUNT and ORDER', () => {
      assert.deepEqual(
        parseArgs(BLMOVEM, 'source', 'destination', 'LEFT', 'LEFT', 0, {
          COUNT: 3,
          ORDER: 'OBO'
        }),
        ['BLMOVEM', 'source', 'destination', 'LEFT', 'LEFT', '0', 'COUNT', '3', 'OBO']
      );
    });

    it('with EXACTLY and ORDER', () => {
      assert.deepEqual(
        parseArgs(BLMOVEM, 'source', 'destination', 'LEFT', 'RIGHT', 0, {
          EXACTLY: 2,
          ORDER: 'BULK'
        }),
        ['BLMOVEM', 'source', 'destination', 'LEFT', 'RIGHT', '0', 'EXACTLY', '2', 'BULK']
      );
    });
  });

  testUtils.testAll('blMoveM - null on timeout', async client => {
    assert.equal(
      await client.blMoveM('{tag}source', '{tag}destination', 'LEFT', 'RIGHT', BLOCKING_MIN_VALUE),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('blMoveM - with elements', async client => {
    const [, reply] = await Promise.all([
      client.rPush('{tag}source', ['1', '2', '3']),
      client.blMoveM('{tag}source', '{tag}destination', 'LEFT', 'LEFT', BLOCKING_MIN_VALUE, {
        COUNT: 2,
        ORDER: 'BULK'
      })
    ]);
    assert.deepEqual(reply, ['1', '2']);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
