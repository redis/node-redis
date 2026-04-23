import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import ZPOPMAX from './ZPOPMAX';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('ZPOPMIN');
    parser.pushKey(key);
  },
  transformReply: ZPOPMAX.transformReply
} as const satisfies Command;
