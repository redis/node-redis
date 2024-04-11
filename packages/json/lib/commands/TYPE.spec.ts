import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TYPE from './TYPE';

describe('JSON.TYPE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        TYPE.transformArguments('key'),
        ['JSON.TYPE', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        TYPE.transformArguments('key', {
          path: '$'
        }),
        ['JSON.TYPE', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.type', async client => {
    assert.equal(
      await client.json.type('key'),
      null
    );
  }, GLOBAL.SERVERS.OPEN);
});
