import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import ZRANDMEMBER from './ZRANDMEMBER';

export default {
  FIRST_KEY_INDEX: ZRANDMEMBER.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZRANDMEMBER.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    ZRANDMEMBER.parseCommand(parser, key);
    parser.push(count.toString());
  },
  transformArguments(key: RedisArgument, count: number) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
