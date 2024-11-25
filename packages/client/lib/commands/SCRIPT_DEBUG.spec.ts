import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SCRIPT_DEBUG from './SCRIPT_DEBUG';
import { parseArgs } from './generic-transformers';

describe('SCRIPT DEBUG', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SCRIPT_DEBUG, 'NO'),
      ['SCRIPT', 'DEBUG', 'NO']
    );
  });

  testUtils.testWithClient('client.scriptDebug', async client => {
    assert.equal(
      await client.scriptDebug('NO'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
