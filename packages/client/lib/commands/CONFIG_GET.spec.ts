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

  testUtils.testWithClient('client.configSet.getSearchConfigSettingTest | Redis >= 8', async client => {
    assert.ok(
      await client.configGet('search-timeout'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.configSet.getTSConfigSettingTest | Redis >= 8', async client => {
    assert.ok(
      await client.configGet('ts-retention-policy'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.configSet.getBFConfigSettingTest | Redis >= 8', async client => {
    assert.ok(
      await client.configGet('bf-error-rate'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.configSet.getCFConfigSettingTest | Redis >= 8', async client => {
    assert.ok(
      await client.configGet('cf-initial-size'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

});
