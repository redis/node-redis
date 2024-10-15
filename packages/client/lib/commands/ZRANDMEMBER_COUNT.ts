import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import ZRANDMEMBER from './ZRANDMEMBER';

export default {
  IS_READ_ONLY: ZRANDMEMBER.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    ZRANDMEMBER.parseCommand(parser, key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
