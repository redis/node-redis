import { strict as assert } from 'node:assert';
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
});
