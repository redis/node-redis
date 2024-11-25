import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_GET from './CONFIG_GET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.CONFIG GET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CONFIG_GET, 'TIMEOUT'),
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
