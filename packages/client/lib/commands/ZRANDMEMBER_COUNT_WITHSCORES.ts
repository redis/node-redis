import { Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';
import ZRANDMEMBER_COUNT from './ZRANDMEMBER_COUNT';
import { transformSortedSetReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZRANDMEMBER_COUNT.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZRANDMEMBER_COUNT.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    ZRANDMEMBER_COUNT.parseCommand(parser, key, count);
    parser.push('WITHSCORES');
  },
  transformArguments(key: RedisArgument, count: number) { return [] },
  transformReply: transformSortedSetReply
} as const satisfies Command;
