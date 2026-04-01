import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GET from './GET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.GET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(GET, 'key'),
        ['JSON.GET', 'key']
      );
    });

    describe('with path', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(GET, 'key', { path: '$' }),
          ['JSON.GET', 'key', '$']
        );
      });

      it('array', () => {
        assert.deepEqual(
          parseArgs(GET, 'key', { path: ['$.1', '$.2'] }),
          ['JSON.GET', 'key', '$.1', '$.2']
        );
      });
    });
  });

  testUtils.testWithClient('client.json.get', async client => {
    assert.equal(
      await client.json.get('key'),
      null
    );

    await client.json.set('noderedis:users:1', '$', { name: 'Alice', age: 32, })
    const res = await client.json.get('noderedis:users:1');
    assert.equal(typeof res, 'object')
    assert.deepEqual(res, { name: 'Alice', age: 32, })

  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.json.get with path', async client => {
    await client.json.set('json:path:test', '$', {
      user: { name: 'Bob', age: 25 },
      count: 42
    });

    // Test JSONPath syntax ($ prefix) - returns array
    const jsonPathResult = await client.json.get('json:path:test', { path: '$.user' });
    assert.ok(Array.isArray(jsonPathResult), 'JSONPath $ syntax returns array');
    assert.equal(jsonPathResult.length, 1);
    assert.deepEqual(jsonPathResult[0], { name: 'Bob', age: 25 });

    // Test legacy path syntax (. prefix) - returns value directly (not array)
    const legacyPathResult = await client.json.get('json:path:test', { path: '.user' });
    assert.ok(!Array.isArray(legacyPathResult), 'Legacy . syntax should not return array');
    assert.deepEqual(legacyPathResult, { name: 'Bob', age: 25 });
  }, GLOBAL.SERVERS.OPEN);
});
