import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Retrieve metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure
   * 
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @see https://redis.io/commands/vinfo/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('VINFO');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
