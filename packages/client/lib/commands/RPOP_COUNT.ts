import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the RPOP command with count parameter
   * 
   * @param parser - The command parser
   * @param key - The list key to pop from
   * @param count - The number of elements to pop
   * @see https://redis.io/commands/rpop/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('RPOP');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply> | NullReply
} as const satisfies Command;
