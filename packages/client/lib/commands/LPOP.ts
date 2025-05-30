import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the LPOP command
   * 
   * @param parser - The command parser
   * @param key - The key of the list to pop from
   * @see https://redis.io/commands/lpop/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('LPOP');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
