import { strict as assert } from 'node:assert';
import XNACK from './XNACK';
import { parseArgs } from './generic-transformers';
import testUtils, { GLOBAL } from '../test-utils';

describe('XNACK', () => {
  describe('transformArguments', () => {
    it('string - SILENT', () => {
      assert.deepEqual(
        parseArgs(XNACK, 'key', 'group', 'SILENT', '0-0'),
        ['XNACK', 'key', 'group', 'SILENT', 'IDS', '1', '0-0']
      );
    });

    it('array - FAIL', () => {
      assert.deepEqual(
        parseArgs(XNACK, 'key', 'group', 'FAIL', ['0-0', '1-0']),
        ['XNACK', 'key', 'group', 'FAIL', 'IDS', '2', '0-0', '1-0']
      );
    });

    it('array - FATAL', () => {
      assert.deepEqual(
        parseArgs(XNACK, 'key', 'group', 'FATAL', ['0-0', '1-0', '2-0']),
        ['XNACK', 'key', 'group', 'FATAL', 'IDS', '3', '0-0', '1-0', '2-0']
      );
    });

    it('with RETRYCOUNT', () => {
      assert.deepEqual(
        parseArgs(XNACK, 'key', 'group', 'FAIL', '0-0', {
          RETRYCOUNT: 7
        }),
        ['XNACK', 'key', 'group', 'FAIL', 'IDS', '1', '0-0', 'RETRYCOUNT', '7']
      );
    });

    it('with FORCE', () => {
      assert.deepEqual(
        parseArgs(XNACK, 'key', 'group', 'FAIL', ['0-0', '1-0'], {
          FORCE: true
        }),
        ['XNACK', 'key', 'group', 'FAIL', 'IDS', '2', '0-0', '1-0', 'FORCE']
      );
    });

    it('with RETRYCOUNT and FORCE', () => {
      assert.deepEqual(
        parseArgs(XNACK, 'key', 'group', 'FAIL', ['0-0', '1-0'], {
          RETRYCOUNT: 3,
          FORCE: true
        }),
        ['XNACK', 'key', 'group', 'FAIL', 'IDS', '2', '0-0', '1-0', 'RETRYCOUNT', '3', 'FORCE']
      );
    });
  });

  testUtils.testWithClient('xNack', async client => {

    const key = `xnack:tmp:${Date.now()}`;
    const group = 'group';
    const consumer = 'consumer-1';

    await client.del(key);
    await client.xGroupCreate(key, group, '0', { MKSTREAM: true });

    const id1 = await client.xAdd(key, '*', { field: '1' });
    const id2 = await client.xAdd(key, '*', { field: '2' });
    const id3 = await client.xAdd(key, '*', { field: '3' });
    const id4 = await client.xAdd(key, '*', { field: '4' });
    const id5 = await client.xAdd(key, '*', { field: '5' });
    const id6 = await client.xAdd(key, '*', { field: '6' });

    await client.xReadGroup(group, consumer, {
      key,
      id: '>'
    });

    const reply = await client.xNack(key, group, 'FAIL', [id1, id2]);
    const replyWithRetryCount = await client.xNack(key, group, 'FAIL', id3, {
      RETRYCOUNT: 7
    });
    const replyWithForce = await client.xNack(key, group, 'FAIL', id4, {
      FORCE: true
    });
    const replyWithRetryCountAndForce = await client.xNack(key, group, 'FAIL', [id5, id6], {
      RETRYCOUNT: 3,
      FORCE: true
    });

    assert.equal(reply, 2);
    assert.equal(replyWithRetryCount, 1);
    assert.equal(replyWithForce, 1);
    assert.equal(replyWithRetryCountAndForce, 2);

    assert.equal(typeof reply, 'number');
    assert.equal(typeof replyWithRetryCount, 'number');
    assert.equal(typeof replyWithForce, 'number');
    assert.equal(typeof replyWithRetryCountAndForce, 'number');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 8]
  });

});
