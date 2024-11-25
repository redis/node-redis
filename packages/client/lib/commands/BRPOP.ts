import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import BLPOP from './BLPOP';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisVariadicArgument, timeout: number) {
    parser.push('BRPOP');
    parser.pushKeys(key);
    parser.push(timeout.toString());
  },
  transformReply: BLPOP.transformReply
} as const satisfies Command;
