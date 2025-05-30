import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Gets all values in a hash.
   * @param parser - The Redis command parser.
   * @param key - Key of the hash.
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('HVALS');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
