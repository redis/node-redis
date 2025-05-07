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
});
