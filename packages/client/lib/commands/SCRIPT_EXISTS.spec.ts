import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SCRIPT_EXISTS from './SCRIPT_EXISTS';
import { parseArgs } from './generic-transformers';

describe('SCRIPT EXISTS', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SCRIPT_EXISTS, 'sha1'),
        ['SCRIPT', 'EXISTS', 'sha1']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SCRIPT_EXISTS, ['1', '2']),
        ['SCRIPT', 'EXISTS', '1', '2']
      );
    });
  });

  testUtils.testWithClient('client.scriptExists', async client => {
    assert.deepEqual(
      await client.scriptExists('sha1'),
      [0]
    );
  }, GLOBAL.SERVERS.OPEN);
});
