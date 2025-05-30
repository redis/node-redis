import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import SRANDMEMBER from './SRANDMEMBER';

export default {
  IS_READ_ONLY: SRANDMEMBER.IS_READ_ONLY,
  /**
   * Constructs the SRANDMEMBER command to get multiple random members from a set
   *
   * @param parser - The command parser
   * @param key - The key of the set to get random members from
   * @param count - The number of members to return. If negative, may return the same member multiple times
   * @see https://redis.io/commands/srandmember/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    SRANDMEMBER.parseCommand(parser, key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
