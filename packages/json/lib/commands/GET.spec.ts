import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GET from './GET';

describe('JSON.GET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        GET.transformArguments('key'),
        ['JSON.GET', 'key']
      );
    });

    describe('with path', () => {
      it('string', () => {
        assert.deepEqual(
          GET.transformArguments('key', { path: '$' }),
          ['JSON.GET', 'key', '$']
        );
      });

      it('array', () => {
        assert.deepEqual(
          GET.transformArguments('key', { path: ['$.1', '$.2'] }),
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
  }, GLOBAL.SERVERS.OPEN);
});
