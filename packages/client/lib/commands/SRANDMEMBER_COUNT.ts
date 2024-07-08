import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import SRANDMEMBER from './SRANDMEMBER';

export default {
  FIRST_KEY_INDEX: SRANDMEMBER.FIRST_KEY_INDEX,
  IS_READ_ONLY: SRANDMEMBER.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    SRANDMEMBER.parseCommand(parser, key);
    parser.push(count.toString());
  },
  transformArguments(key: RedisArgument, count: number) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
