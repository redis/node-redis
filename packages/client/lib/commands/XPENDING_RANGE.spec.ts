import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XPENDING_RANGE from './XPENDING_RANGE';
import { parseArgs } from './generic-transformers';

describe('XPENDING RANGE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XPENDING_RANGE, 'key', 'group', '-', '+', 1),
        ['XPENDING', 'key', 'group', '-', '+', '1']
      );
    });

    it('with IDLE', () => {
      assert.deepEqual(
        parseArgs(XPENDING_RANGE, 'key', 'group', '-', '+', 1, {
          IDLE: 1,
        }),
        ['XPENDING', 'key', 'group', 'IDLE', '1', '-', '+', '1']
      );
    });

    it('with consumer', () => {
      assert.deepEqual(
        parseArgs(XPENDING_RANGE, 'key', 'group', '-', '+', 1, {
          consumer: 'consumer'
        }),
        ['XPENDING', 'key', 'group', '-', '+', '1', 'consumer']
      );
    });

    it('with IDLE, consumer', () => {
      assert.deepEqual(
        parseArgs(XPENDING_RANGE, 'key', 'group', '-', '+', 1, {
          IDLE: 1,
          consumer: 'consumer'
        }),
        ['XPENDING', 'key', 'group', 'IDLE', '1', '-', '+', '1', 'consumer']
      );
    });
  });

  testUtils.testAll('xPendingRange', async client => {
    const [, id, , reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xAdd('key', '*', { field: 'value' }),
      client.xReadGroup('group', 'consumer', {
        key: 'key',
        id: '>'
      }),
      client.xPendingRange('key', 'group', '-', '+', 1)
    ]);

    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 1);
    assert.equal(reply[0].id, id);
    assert.equal(reply[0].consumer, 'consumer');
    assert.equal(typeof reply[0].millisecondsSinceLastDelivery, 'number');
    assert.equal(reply[0].deliveriesCounter, 1);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
