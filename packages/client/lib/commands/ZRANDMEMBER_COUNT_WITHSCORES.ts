import { CommandParser } from '../client/parser';
import { Command, RedisArgument } from '../RESP/types';
import { transformSortedSetReply } from './generic-transformers';
import ZRANDMEMBER_COUNT from './ZRANDMEMBER_COUNT';

export default {
  IS_READ_ONLY: ZRANDMEMBER_COUNT.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    ZRANDMEMBER_COUNT.parseCommand(parser, key, count);
    parser.push('WITHSCORES');
  },
  transformReply: transformSortedSetReply
} as const satisfies Command;
