import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the HSTRLEN command
   * 
   * @param parser - The command parser
   * @param key - The key of the hash
   * @param field - The field to get the string length of
   * @see https://redis.io/commands/hstrlen/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, field: RedisArgument) {
    parser.push('HSTRLEN');
    parser.pushKey(key);
    parser.push(field);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
