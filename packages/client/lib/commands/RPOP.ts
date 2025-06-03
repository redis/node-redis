import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the RPOP command
   * 
   * @param parser - The command parser
   * @param key - The list key to pop from
   * @see https://redis.io/commands/rpop/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('RPOP');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
