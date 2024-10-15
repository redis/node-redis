import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARRINDEX from './ARRINDEX';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.ARRINDEX', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ARRINDEX, 'key', '$', 'value'),
        ['JSON.ARRINDEX', 'key', '$', '"value"']
      );
    });

    describe('with range', () => {
      it('start only', () => {
        assert.deepEqual(
          parseArgs(ARRINDEX, 'key', '$', 'value', {
            range: {
              start: 0
            }
          }),
          ['JSON.ARRINDEX', 'key', '$', '"value"', '0']
        );
      });

      it('with start and stop', () => {
        assert.deepEqual(
          parseArgs(ARRINDEX, 'key', '$', 'value', {
            range: {
              start: 0,
              stop: 1
            }
          }),
          ['JSON.ARRINDEX', 'key', '$', '"value"', '0', '1']
        );
      });
    });
  });

  testUtils.testWithClient('client.json.arrIndex', async client => {
    const [, reply] = await Promise.all([
      client.json.set('key', '$', []),
      client.json.arrIndex('key', '$', 'value')
    ]);

    assert.deepEqual(reply, [-1]);
  }, GLOBAL.SERVERS.OPEN);
});
