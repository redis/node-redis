import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XCLAIM_JUSTID from './XCLAIM_JUSTID';
import { parseArgs } from './generic-transformers';

describe('XCLAIM JUSTID', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(XCLAIM_JUSTID, 'key', 'group', 'consumer', 1, '0-0'),
      ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'JUSTID']
    );
  });

  testUtils.testAll('xClaimJustId', async client => {
    const message = { field: 'value' };

    await client.xGroupCreate('key', 'group', '$', {
      MKSTREAM: true
    });
    await client.xAdd('key', '1-0', message);
    await client.xAdd('key', '2-0', message);
    await client.xReadGroup('group', 'consumer1', {
      key: 'key',
      id: '>'
    });
    const reply = await client.xClaimJustId('key', 'group', 'consumer2', 0, ['1-0', '2-0']);

    assert.deepEqual(reply, ['1-0', '2-0']);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
