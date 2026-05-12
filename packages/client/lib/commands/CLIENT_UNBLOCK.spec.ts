import { strict as assert } from 'node:assert';
import CLIENT_UNBLOCK, { CLIENT_UNBLOCK_MODES } from './CLIENT_UNBLOCK';
import { parseArgs } from './generic-transformers';

describe('CLIENT UNBLOCK', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(CLIENT_UNBLOCK, 1),
        ['CLIENT', 'UNBLOCK', '1']
      );
    });

    it('with string client id', () => {
      assert.deepEqual(
        parseArgs(CLIENT_UNBLOCK, '1'),
        ['CLIENT', 'UNBLOCK', '1']
      );
    });

    it('with mode', () => {
      assert.deepEqual(
        parseArgs(CLIENT_UNBLOCK, 1, CLIENT_UNBLOCK_MODES.ERROR),
        ['CLIENT', 'UNBLOCK', '1', 'ERROR']
      );
    });
  });
});
