import { strict as assert } from 'node:assert';
import { spy } from 'sinon';
import RedisClient from '.';
import { defineScript } from '../lua-script';
import { BasicCommandParser, CommandParser } from './parser';
import { BlobStringReply, NumberReply } from '../RESP/types';

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

const READ_ONLY_GET_SCRIPT = defineScript({
  SCRIPT: `return redis.call('GET', KEYS[1])`,
  NUMBER_OF_KEYS: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: string) {
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply
});

describe('_executeScript NOSCRIPT fallback', () => {
  it('retries with EVAL_RO for read-only scripts', async () => {
    const client = RedisClient.create({});
    const sendCommand = spy(async (args: ReadonlyArray<unknown>) => {
      if (args[0] === 'EVALSHA_RO') {
        throw new Error('NOSCRIPT No matching script');
      }
      return 'ok';
    });
    (client as unknown as { sendCommand: typeof sendCommand }).sendCommand = sendCommand;

    const parser = new BasicCommandParser();
    parser.push('EVALSHA_RO', READ_ONLY_GET_SCRIPT.SHA1, '1', 'k');
    await client._executeScript(READ_ONLY_GET_SCRIPT, parser, undefined, undefined);

    assert.equal(sendCommand.callCount, 2);
    assert.equal(sendCommand.getCall(1).args[0][0], 'EVAL_RO');
    assert.equal(sendCommand.getCall(1).args[0][1], READ_ONLY_GET_SCRIPT.SCRIPT);
  });

  it('retries with EVAL for writable scripts', async () => {
    const client = RedisClient.create({});
    const sendCommand = spy(async (args: ReadonlyArray<unknown>) => {
      if (args[0] === 'EVALSHA') {
        throw new Error('NOSCRIPT No matching script');
      }
      return 4;
    });
    (client as unknown as { sendCommand: typeof sendCommand }).sendCommand = sendCommand;

    const parser = new BasicCommandParser();
    parser.push('EVALSHA', SQUARE_SCRIPT.SHA1, '1', 'k');
    await client._executeScript(SQUARE_SCRIPT, parser, undefined, undefined);

    assert.equal(sendCommand.callCount, 2);
    assert.equal(sendCommand.getCall(1).args[0][0], 'EVAL');
    assert.equal(sendCommand.getCall(1).args[0][1], SQUARE_SCRIPT.SCRIPT);
  });
});
