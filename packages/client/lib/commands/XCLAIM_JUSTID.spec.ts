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

  // TODO: test with messages
  testUtils.testWithClient('client.xClaimJustId', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xClaimJustId('key', 'group', 'consumer', 1, '0-0')
    ]);

    assert.deepEqual(reply, []);
  }, GLOBAL.SERVERS.OPEN);
});
