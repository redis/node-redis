import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SCRIPT_LOAD from './SCRIPT_LOAD';
import { scriptSha1 } from '../lua-script';

describe('SCRIPT LOAD', () => {
  const SCRIPT = 'return 1;',
    SCRIPT_SHA1 = scriptSha1(SCRIPT);

  it('transformArguments', () => {
    assert.deepEqual(
      SCRIPT_LOAD.transformArguments(SCRIPT),
      ['SCRIPT', 'LOAD', SCRIPT]
    );
  });

  testUtils.testWithClient('client.scriptLoad', async client => {
    assert.equal(
      await client.scriptLoad(SCRIPT),
      SCRIPT_SHA1
    );
  }, GLOBAL.SERVERS.OPEN);
});
