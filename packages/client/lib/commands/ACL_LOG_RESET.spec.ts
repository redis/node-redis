import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ACL_LOG_RESET from './ACL_LOG_RESET';
import { parseArgs } from './generic-transformers';

describe('ACL LOG RESET', () => {
  testUtils.isVersionGreaterThanHook([6]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ACL_LOG_RESET),
      ['ACL', 'LOG', 'RESET']
    );
  });

  testUtils.testWithClient('client.aclLogReset', async client => {
    assert.equal(
      await client.aclLogReset(),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
