import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, ArrayReply, Command, NullReply } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Retrieve random elements of a vector set
   * 
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @param count - Optional number of elements to return
   * @see https://redis.io/commands/vrandmember/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count?: number) {
    parser.push('VRANDMEMBER');
    parser.pushKey(key);
    
    if (count !== undefined) {
      parser.push(count.toString());
    }
  },
  transformReply: undefined as unknown as () => BlobStringReply | ArrayReply<BlobStringReply> | NullReply
} as const satisfies Command;
