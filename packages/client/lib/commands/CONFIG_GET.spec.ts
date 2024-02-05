import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_GET from './CONFIG_GET';

describe('CONFIG GET', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        CONFIG_GET.transformArguments('*'),
        ['CONFIG', 'GET', '*']
      );
    });

    it('Array', () => {
      assert.deepEqual(
        CONFIG_GET.transformArguments(['1', '2']),
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
