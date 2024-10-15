import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EVAL from './EVAL';
import { parseArgs } from './generic-transformers';

describe('EVAL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EVAL, 'return KEYS[1] + ARGV[1]', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['EVAL', 'return KEYS[1] + ARGV[1]', '1', 'key', 'argument']
    );
  });

  testUtils.testAll('eval', async client => {
    assert.equal(
      await client.eval('return 1'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
