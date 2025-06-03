import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the SRANDMEMBER command to get a random member from a set
   *
   * @param parser - The command parser
   * @param key - The key of the set to get random member from
   * @see https://redis.io/commands/srandmember/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('SRANDMEMBER')
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
