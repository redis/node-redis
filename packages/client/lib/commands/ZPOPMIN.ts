import { RedisArgument, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import ZPOPMAX from './ZPOPMAX';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('ZPOPMIN');
    parser.pushKey(key);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: ZPOPMAX.transformReply
} as const satisfies Command;
