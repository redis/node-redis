import { strict as assert } from 'node:assert';
import AUTH from './AUTH';
import { parseArgs } from './generic-transformers';

describe('AUTH', () => {
  describe('transformArguments', () => {
    it('password only', () => {
      assert.deepEqual(
        parseArgs(AUTH, {
          password: 'password'
        }),
        ['AUTH', 'password']
      );
    });

    it('username & password', () => {
      assert.deepEqual(
        parseArgs(AUTH, {
          username: 'username',
          password: 'password'
        }),
        ['AUTH', 'username', 'password']
      );
    });
  });
});
