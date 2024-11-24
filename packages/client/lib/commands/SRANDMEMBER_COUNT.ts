import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import SRANDMEMBER from './SRANDMEMBER';

export default {
  IS_READ_ONLY: SRANDMEMBER.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    SRANDMEMBER.parseCommand(parser, key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
