import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LOLWUT from './LOLWUT';
import { parseArgs } from './generic-transformers';

describe('LOLWUT', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(LOLWUT),
        ['LOLWUT']
      );
    });

    it('with version', () => {
      assert.deepEqual(
        parseArgs(LOLWUT, 5),
        ['LOLWUT', 'VERSION', '5']
      );
    });

    it('with version and optional arguments', () => {
      assert.deepEqual(
        parseArgs(LOLWUT, 5, 1, 2, 3),
        ['LOLWUT', 'VERSION', '5', '1', '2', '3']
      );
    });
  });

  testUtils.testWithClient('client.LOLWUT', async client => {
    assert.equal(
      typeof (await client.LOLWUT()),
      'string'
    );
  }, GLOBAL.SERVERS.OPEN);
});
