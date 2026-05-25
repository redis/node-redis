import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import BZPOPMAX from './BZPOPMAX';

export default {
  IS_READ_ONLY: BZPOPMAX.IS_READ_ONLY,
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument, timeout: number) {
    parser.push('BZPOPMIN');
    parser.pushKeys(keys);
    parser.push(timeout.toString());
  },
  transformReply: BZPOPMAX.transformReply
} as const satisfies Command;

