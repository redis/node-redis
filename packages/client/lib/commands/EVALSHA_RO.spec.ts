import { strict as assert } from 'node:assert';
import testUtils from '../test-utils';
import EVALSHA_RO from './EVALSHA_RO';

describe('EVALSHA_RO', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      EVALSHA_RO.transformArguments('sha1', {
        keys: ['key'],
        arguments: ['argument']
      }),
      ['EVALSHA_RO', 'sha1', '1', 'key', 'argument']
    );
  });
});
