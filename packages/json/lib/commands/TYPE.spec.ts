import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import TYPE from './TYPE';

describe('TYPE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        transformArguments('key'),
        ['JSON.TYPE', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        transformArguments('key', {
          path: '$'
        }),
        ['JSON.TYPE', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.type', async client => {
    assert.deepEqual(
      await client.json.type('key', {
        path: '$'
      }),
      [null]
    );
  }, GLOBAL.SERVERS.OPEN);
});
