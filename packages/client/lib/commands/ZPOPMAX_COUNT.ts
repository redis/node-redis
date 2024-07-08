import { RedisArgument, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('ZPOPMAX');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformArguments(key: RedisArgument, count: number) { return [] },
  transformReply: transformSortedSetReply
} as const satisfies Command;
