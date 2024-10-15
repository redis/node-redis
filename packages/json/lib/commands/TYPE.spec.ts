import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TYPE from './TYPE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.TYPE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(TYPE, 'key'),
        ['JSON.TYPE', 'key']
      );
    });

    it('with path', () => {
      assert.deepEqual(
        parseArgs(TYPE, 'key', {
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
