import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import ZPOPMAX from './ZPOPMAX';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('ZPOPMIN');
    parser.pushKey(key);
  },
  transformReply: ZPOPMAX.transformReply
} as const satisfies Command;
