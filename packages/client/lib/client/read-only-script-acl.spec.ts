import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { defineScript } from '../lua-script';
import { BlobStringReply, NumberReply } from '../RESP/types';
import { CommandParser } from './parser';
import { createClient } from '../../index';

const READ_ONLY_GET_SCRIPT = defineScript({
  SCRIPT: `return redis.call('GET', KEYS[1])`,
  NUMBER_OF_KEYS: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: string) {
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply
});

const MISLABELED_WRITE_SCRIPT = defineScript({
  SCRIPT: `return redis.call('SET', KEYS[1], ARGV[1])`,
  NUMBER_OF_KEYS: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: string, value: string) {
    parser.pushKey(key);
    parser.push(value);
  },
  transformReply: undefined as unknown as () => BlobStringReply
});

const WRITABLE_SET_SCRIPT = defineScript({
  SCRIPT: `return redis.call('SET', KEYS[1], ARGV[1])`,
  NUMBER_OF_KEYS: 1,
  parseCommand(parser: CommandParser, key: string, value: string) {
    parser.pushKey(key);
    parser.push(value);
  },
  transformReply: undefined as unknown as () => BlobStringReply
});

const SQUARE_SCRIPT = defineScript({
  SCRIPT:
    `local number = redis.call('GET', KEYS[1])
    return number * number`,
  NUMBER_OF_KEYS: 1,
  parseCommand(parser: CommandParser, key: string) {
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
});

const RO_ACL = [
  'reset', 'on', '>pw', '~*',
  '+hello', '+auth', '+ping', '+client|setinfo',
  '+eval_ro', '+evalsha_ro', '+get', '+multi', '+exec'
] as const;

const RW_ACL = [
  'reset', 'on', '>pw', '~*',
  '+hello', '+auth', '+ping', '+client|setinfo',
  '+eval', '+evalsha', '+get', '+set', '+multi', '+exec'
] as const;

describe('read-only scripts with EVAL_RO ACL (#3563)', () => {
  testUtils.isVersionGreaterThanHook([7]);

  testUtils.testWithClient('cold cache, cached, MULTI, and mislabeled write', async admin => {
    const username = 'eval-ro-acl';

    await admin.sendCommand(['ACL', 'SETUSER', username, ...RO_ACL]);
    await admin.set('k', 'v');
    await admin.scriptFlush();

    // Scripts are bound at client-class creation time; duplicate() does not attach them.
    const client = await createClient({
      socket: admin.options.socket,
      RESP: admin.options.RESP,
      username,
      password: 'pw',
      scripts: {
        getRo: READ_ONLY_GET_SCRIPT,
        badWrite: MISLABELED_WRITE_SCRIPT
      }
    }).connect();

    try {
      // Cold cache: EVALSHA_RO miss must fall back to EVAL_RO (not EVAL).
      assert.equal(await client.getRo('k'), 'v');
      // Cached: subsequent call uses EVALSHA_RO without SCRIPT LOAD.
      assert.equal(await client.getRo('k'), 'v');

      await admin.scriptFlush();

      // MULTI: first queued call loads via EVAL_RO, second uses EVALSHA_RO.
      assert.deepEqual(
        await client.multi()
          .getRo('k')
          .getRo('k')
          .exec(),
        ['v', 'v']
      );

      // Mislabeled IS_READ_ONLY write must fail without modifying the key.
      await admin.set('write-key', 'before');
      await assert.rejects(
        () => client.badWrite('write-key', 'after'),
        (err: Error) =>
          /read-only|Write commands are not allowed|no permissions to run the 'set'/i.test(
            err.message
          )
      );
      assert.equal(await admin.get('write-key'), 'before');
    } finally {
      client.destroy();
      await admin.sendCommand(['ACL', 'DELUSER', username]);
    }
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('writable scripts still use EVAL family under RW ACL', async admin => {
    const username = 'eval-rw-acl';

    await admin.sendCommand(['ACL', 'SETUSER', username, ...RW_ACL]);
    await admin.set('n', '3');
    await admin.scriptFlush();

    const client = await createClient({
      socket: admin.options.socket,
      RESP: admin.options.RESP,
      username,
      password: 'pw',
      scripts: {
        square: SQUARE_SCRIPT,
        setValue: WRITABLE_SET_SCRIPT
      }
    }).connect();

    try {
      assert.equal(await client.square('n'), 9);
      assert.equal(await client.setValue('n', '4'), 'OK');
      assert.equal(await client.square('n'), 16);
    } finally {
      client.destroy();
      await admin.sendCommand(['ACL', 'DELUSER', username]);
    }
  }, GLOBAL.SERVERS.OPEN);
});
