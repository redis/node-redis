import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LMOVEM from './LMOVEM';
import { parseArgs } from './generic-transformers';

describe('LMOVEM', () => {
  testUtils.isVersionGreaterThanHook([8, 10]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(LMOVEM, 'source', 'destination', 'LEFT', 'RIGHT'),
        ['LMOVEM', 'source', 'destination', 'LEFT', 'RIGHT']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(LMOVEM, 'source', 'destination', 'LEFT', 'RIGHT', {
          COUNT: 3
        }),
        ['LMOVEM', 'source', 'destination', 'LEFT', 'RIGHT', 'COUNT', '3']
      );
    });

    it('with COUNT and ORDER', () => {
      assert.deepEqual(
        parseArgs(LMOVEM, 'source', 'destination', 'LEFT', 'LEFT', {
          COUNT: 3,
          ORDER: 'OBO'
        }),
        ['LMOVEM', 'source', 'destination', 'LEFT', 'LEFT', 'COUNT', '3', 'OBO']
      );
    });

    it('with EXACTLY and ORDER', () => {
      assert.deepEqual(
        parseArgs(LMOVEM, 'source', 'destination', 'LEFT', 'RIGHT', {
          EXACTLY: 2,
          ORDER: 'BULK'
        }),
        ['LMOVEM', 'source', 'destination', 'LEFT', 'RIGHT', 'EXACTLY', '2', 'BULK']
      );
    });
  });

  testUtils.testAll('lMoveM - null when source empty', async client => {
    assert.equal(
      await client.lMoveM('{tag}source', '{tag}destination', 'LEFT', 'RIGHT'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('lMoveM - COUNT with OBO ordering', async client => {
    await client.rPush('{tag}source', ['1', '2', '3', '4', '5']);
    assert.deepEqual(
      await client.lMoveM('{tag}source', '{tag}destination', 'LEFT', 'LEFT', {
        COUNT: 3,
        ORDER: 'OBO'
      }),
      ['3', '2', '1']
    );
    assert.deepEqual(
      await client.lRange('{tag}destination', 0, -1),
      ['3', '2', '1']
    );
    assert.deepEqual(
      await client.lRange('{tag}source', 0, -1),
      ['4', '5']
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('lMoveM - COUNT with BULK ordering', async client => {
    await client.rPush('{tag}source', ['1', '2', '3', '4', '5']);
    assert.deepEqual(
      await client.lMoveM('{tag}source', '{tag}destination', 'LEFT', 'LEFT', {
        COUNT: 3,
        ORDER: 'BULK'
      }),
      ['1', '2', '3']
    );
    assert.deepEqual(
      await client.lRange('{tag}destination', 0, -1),
      ['1', '2', '3']
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('lMoveM - no options moves a single element as an array', async client => {
    await client.rPush('{tag}source', ['1', '2', '3']);
    assert.deepEqual(
      await client.lMoveM('{tag}source', '{tag}destination', 'LEFT', 'RIGHT'),
      ['1']
    );
    assert.deepEqual(
      await client.lRange('{tag}source', 0, -1),
      ['2', '3']
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('lMoveM - COUNT clamps to available elements', async client => {
    await client.rPush('{tag}source', ['1', '2', '3']);
    assert.deepEqual(
      await client.lMoveM('{tag}source', '{tag}destination', 'LEFT', 'LEFT', {
        COUNT: 10,
        ORDER: 'BULK'
      }),
      ['1', '2', '3']
    );
    assert.equal(await client.exists('{tag}source'), 0);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('lMoveM - EXACTLY with too few elements moves nothing', async client => {
    await client.rPush('{tag}source', ['1', '2']);
    await assert.rejects(
      client.lMoveM('{tag}source', '{tag}destination', 'LEFT', 'RIGHT', {
        EXACTLY: 3,
        ORDER: 'BULK'
      })
    );
    assert.deepEqual(
      await client.lRange('{tag}source', 0, -1),
      ['1', '2']
    );
    assert.equal(await client.exists('{tag}destination'), 0);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
