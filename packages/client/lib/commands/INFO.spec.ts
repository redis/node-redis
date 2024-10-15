import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INFO from './INFO';
import { parseArgs } from './generic-transformers';

describe('INFO', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(INFO),
        ['INFO']
      );
    });

    it('server section', () => {
      assert.deepEqual(
        parseArgs(INFO, 'server'),
        ['INFO', 'server']
      );
    });
  });

  testUtils.testWithClient('client.info', async client => {
    assert.equal(
      typeof await client.info(),
      'string'
    );
  }, GLOBAL.SERVERS.OPEN);
});
