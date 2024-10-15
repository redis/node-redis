import { strict as assert } from 'node:assert';
import MIGRATE from './MIGRATE';
import { parseArgs } from './generic-transformers';

describe('MIGRATE', () => {
  describe('transformArguments', () => {
    it('single key', () => {
      assert.deepEqual(
        parseArgs(MIGRATE, '127.0.0.1', 6379, 'key', 0, 10),
        ['MIGRATE', '127.0.0.1', '6379', 'key', '0', '10']
      );
    });

    it('multiple keys', () => {
      assert.deepEqual(
        parseArgs(MIGRATE, '127.0.0.1', 6379, ['1', '2'], 0, 10),
        ['MIGRATE', '127.0.0.1', '6379', '', '0', '10', 'KEYS', '1', '2']
      );
    });

    it('with COPY', () => {
      assert.deepEqual(
        parseArgs(MIGRATE, '127.0.0.1', 6379, 'key', 0, 10, {
          COPY: true
        }),
        ['MIGRATE', '127.0.0.1', '6379', 'key', '0', '10', 'COPY']
      );
    });

    it('with REPLACE', () => {
      assert.deepEqual(
        parseArgs(MIGRATE, '127.0.0.1', 6379, 'key', 0, 10, {
          REPLACE: true
        }),
        ['MIGRATE', '127.0.0.1', '6379', 'key', '0', '10', 'REPLACE']
      );
    });

    describe('with AUTH', () => {
      it('password only', () => {
        assert.deepEqual(
          parseArgs(MIGRATE, '127.0.0.1', 6379, 'key', 0, 10, {
            AUTH: {
              password: 'password'
            }
          }),
          ['MIGRATE', '127.0.0.1', '6379', 'key', '0', '10', 'AUTH', 'password']
        );
      });

      it('username & password', () => {
        assert.deepEqual(
          parseArgs(MIGRATE, '127.0.0.1', 6379, 'key', 0, 10, {
            AUTH: {
              username: 'username',
              password: 'password'
            }
          }),
          ['MIGRATE', '127.0.0.1', '6379', 'key', '0', '10', 'AUTH2', 'username', 'password']
        );
      });
    });

    it('with COPY, REPLACE, AUTH', () => {
      assert.deepEqual(
        parseArgs(MIGRATE, '127.0.0.1', 6379, 'key', 0, 10, {
          COPY: true,
          REPLACE: true,
          AUTH: {
            password: 'password'
          }
        }),
        ['MIGRATE', '127.0.0.1', '6379', 'key', '0', '10', 'COPY', 'REPLACE', 'AUTH', 'password']
      );
    });
  });
});
