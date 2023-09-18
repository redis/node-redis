import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SET from './SET';

describe('JSON.SET', () => {
  describe('transformArguments', () => {
    it('transformArguments', () => {
      assert.deepEqual(
        SET.transformArguments('key', '$', 'json'),
        ['JSON.SET', 'key', '$', '"json"']
      );
    });

    it('NX', () => {
      assert.deepEqual(
        SET.transformArguments('key', '$', 'json', { NX: true }),
        ['JSON.SET', 'key', '$', '"json"', 'NX']
      );
    });

    it('XX', () => {
      assert.deepEqual(
        SET.transformArguments('key', '$', 'json', { XX: true }),
        ['JSON.SET', 'key', '$', '"json"', 'XX']
      );
    });
  });

  testUtils.testWithClient('client.json.set', async client => {
    assert.equal(
      await client.json.set('key', '$', 'json'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
