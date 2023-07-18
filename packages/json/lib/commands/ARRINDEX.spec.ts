import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRINDEX from './ARRINDEX';

describe('JSON.ARRINDEX', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        ARRINDEX.transformArguments('key', '$', 'json'),
        ['JSON.ARRINDEX', 'key', '$', '"json"']
      );
    });
    

    describe('with range', () => {
      it('start only', () => {
        assert.deepEqual(
          ARRINDEX.transformArguments('key', '$', 'json', {
            range: {
              start: 0
            }
          }),
          ['JSON.ARRINDEX', 'key', '$', '"json"', '0']
        );
      });

      it('with start and stop', () => {
        assert.deepEqual(
          ARRINDEX.transformArguments('key', '$', 'json', {
            range: {
              start: 0,
              stop: 1
            }
          }),
          ['JSON.ARRINDEX', 'key', '$', '"json"', '0', '1']
        );
      });
    });
  });

  testUtils.testWithClient('client.json.arrIndex', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', []),
      client.json.arrIndex('key', '$', 'json')
    ]);

    assert.deepEqual(reply, [-1]);
  }, GLOBAL.SERVERS.OPEN);
});
