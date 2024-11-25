import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import EVALSHA_RO from './EVALSHA_RO';
import { parseArgs } from './generic-transformers';

describe('EVALSHA_RO', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EVALSHA_RO, 'sha1', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['EVALSHA_RO', 'sha1', '1', 'key', 'argument']
    );
  });
});
