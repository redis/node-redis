import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XAUTOCLAIM_JUSTID from './XAUTOCLAIM_JUSTID';
import { parseArgs } from './generic-transformers';

describe('XAUTOCLAIM JUSTID', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XAUTOCLAIM_JUSTID, 'key', 'group', 'consumer', 1, '0-0'),
      ['XAUTOCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'JUSTID']
    );
  });

  testUtils.testWithClient('client.xAutoClaimJustId', async client => {
    const [, , id, , reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xGroupCreateConsumer('key', 'group', 'consumer'),
      client.xAdd('key', '*', {
        field: 'value'
      }),
      client.xReadGroup('group', 'consumer', {
        key: 'key',
        id: '>'
      }),
      client.xAutoClaimJustId('key', 'group', 'consumer', 0, '0-0')
    ]);

    assert.deepEqual(reply, {
      nextId: '0-0',
      messages: [id],
      deletedMessages: testUtils.isVersionGreaterThan([7, 0]) ? [] : undefined
    });
  }, GLOBAL.SERVERS.OPEN);
});
