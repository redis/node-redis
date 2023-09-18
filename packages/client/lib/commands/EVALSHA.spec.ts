import { strict as assert } from 'node:assert';
import EVALSHA from './EVALSHA';

describe('EVALSHA', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      EVALSHA.transformArguments('sha1', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['EVALSHA', 'sha1', '1', 'key', 'argument']
    );
  });
});
