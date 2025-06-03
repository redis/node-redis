import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the SPOP command to remove and return a random member from a set
   *
   * @param parser - The command parser
   * @param key - The key of the set to pop from
   * @see https://redis.io/commands/spop/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('SPOP');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
