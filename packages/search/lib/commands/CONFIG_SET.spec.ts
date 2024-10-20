import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_SET from './CONFIG_SET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.CONFIG SET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CONFIG_SET, 'TIMEOUT', '500'),
      ['FT.CONFIG', 'SET', 'TIMEOUT', '500']
    );
  });

  testUtils.testWithClient('client.ft.configSet', async client => {
    assert.deepEqual(
      await client.ft.configSet('TIMEOUT', '500'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
