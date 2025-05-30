import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, SetReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SMEMBERS command
   * 
   * @param parser - The command parser
   * @param key - The set key to get all members from
   * @see https://redis.io/commands/smembers/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('SMEMBERS');
    parser.pushKey(key);
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
