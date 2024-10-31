import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EVAL_RO from './EVAL_RO';
import { parseArgs } from './generic-transformers';

describe('EVAL_RO', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EVAL_RO, 'return KEYS[1] + ARGV[1]', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['EVAL_RO', 'return KEYS[1] + ARGV[1]', '1', 'key', 'argument']
    );
  });

  testUtils.testAll('evalRo', async cluster => {
    assert.equal(
      await cluster.evalRo('return 1'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
