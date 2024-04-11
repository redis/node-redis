import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_GET from './CONFIG_GET';

describe('FT.CONFIG GET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CONFIG_GET.transformArguments('TIMEOUT'),
      ['FT.CONFIG', 'GET', 'TIMEOUT']
    );
  });

  testUtils.testWithClient('client.ft.configGet', async client => {
    assert.deepEqual(
      await client.ft.configGet('TIMEOUT'),
      Object.create(null, {
        TIMEOUT: {
          value: '500',
          configurable: true,
          enumerable: true
        }
      })
    );
  }, GLOBAL.SERVERS.OPEN);
});
