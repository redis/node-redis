import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('ZPOPMAX');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
