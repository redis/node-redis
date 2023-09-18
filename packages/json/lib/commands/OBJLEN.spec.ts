import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import OBJLEN from './OBJLEN';

describe('JSON.OBJLEN', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        OBJLEN.transformArguments('key'),
        ['JSON.OBJLEN', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        OBJLEN.transformArguments('key', {
          path: '$'
        }),
        ['JSON.OBJLEN', 'key', '$']
      );
    });
  });

  testUtils.testWithClient('client.json.objLen', async client => {
    assert.equal(
      await client.json.objLen('key'),
      null
    );
  }, GLOBAL.SERVERS.OPEN);
});
