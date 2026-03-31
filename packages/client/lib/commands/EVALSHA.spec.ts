import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import EVALSHA from './EVALSHA';
import { parseArgs } from './generic-transformers';

describe('EVALSHA', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EVALSHA, 'sha1', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['EVALSHA', 'sha1', '1', 'key', 'argument']
    );
  });

  testUtils.testWithClient('client.evalSha', async client => {
    const sha1 = await client.scriptLoad('return 1');

    assert.equal(
      await client.evalSha(sha1),
      1
    );
  }, GLOBAL.SERVERS.OPEN);
});
