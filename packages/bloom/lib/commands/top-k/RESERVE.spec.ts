import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import RESERVE from './RESERVE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TOPK.RESERVE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'topK', 3),
        ['TOPK.RESERVE', 'topK', '3']
      );
    });

    it('with options', () => {
      assert.deepEqual(
        parseArgs(RESERVE, 'topK', 3, {
          width: 8,
          depth: 7,
          decay: 0.9
        }),
        ['TOPK.RESERVE', 'topK', '3', '8', '7', '0.9']
      );
    });
  });

  testUtils.testWithClient('client.topK.reserve', async client => {
    assert.equal(
      await client.topK.reserve('topK', 3),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
