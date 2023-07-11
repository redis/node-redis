import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import TOGGLE from './TOGGLE';

describe('JSON.TOGGLE', () => {
  describe('transformArguments', () => {
    it('without path', () => {
      assert.deepEqual(
        TOGGLE.transformArguments('key'),
        ['JSON.TOGGLE', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        TOGGLE.transformArguments('key', '$'),
        ['JSON.TOGGLE', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.toggle', async client => {
    await client.json.set('key', '$', '');

    assert.deepEqual(
      await client.json.toggle('key', '$'),
      [0]
    );
  }, GLOBAL.SERVERS.OPEN);
});
