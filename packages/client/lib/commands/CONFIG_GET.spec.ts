import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_GET from './CONFIG_GET';
import { parseArgs } from './generic-transformers';

describe('CONFIG GET', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(CONFIG_GET, '*'),
        ['CONFIG', 'GET', '*']
      );
    });

    it('Array', () => {
      assert.deepEqual(
        parseArgs(CONFIG_GET, ['1', '2']),
        ['CONFIG', 'GET', '1', '2']
      );
    });
  });
  

  testUtils.testWithClient('client.configGet', async client => {
    const config = await client.configGet('*');
    assert.equal(typeof config, 'object');
    for (const [key, value] of Object.entries(config)) {
      assert.equal(typeof key, 'string');
      assert.equal(typeof value, 'string');
    }
  }, GLOBAL.SERVERS.OPEN);
});
