import { Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import BLPOP from './BLPOP';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisVariadicArgument, timeout: number) {
    parser.push('BRPOP');
    parser.pushKeys(key);
    parser.push(timeout.toString());
  },
  transformArguments(
    key: RedisVariadicArgument,
    timeout: number
  ) { return [] },
  transformReply: BLPOP.transformReply
} as const satisfies Command;
