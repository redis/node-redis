import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns a random member from a sorted set.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('ZRANDMEMBER');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
