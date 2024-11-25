import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SET from './SET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.SET', () => {
  describe('transformArguments', () => {
    it('transformArguments', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json'),
        ['JSON.SET', 'key', '$', '"json"']
      );
    });

    it('NX', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json', { NX: true }),
        ['JSON.SET', 'key', '$', '"json"', 'NX']
      );
    });

    it('XX', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', '$', 'json', { XX: true }),
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
