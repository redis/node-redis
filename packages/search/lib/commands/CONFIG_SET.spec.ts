import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_SET from './CONFIG_SET';

describe('FT.CONFIG SET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CONFIG_SET.transformArguments('TIMEOUT', '500'),
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
