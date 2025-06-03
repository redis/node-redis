import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the MGET command
   * 
   * @param parser - The command parser
   * @param keys - Array of keys to get
   * @see https://redis.io/commands/mget/
   */
  parseCommand(parser: CommandParser, keys: Array<RedisArgument>) {
    parser.push('MGET');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => Array<BlobStringReply | NullReply>
} as const satisfies Command;
