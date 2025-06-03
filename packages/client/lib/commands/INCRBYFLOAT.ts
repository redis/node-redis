import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the INCRBYFLOAT command
   * 
   * @param parser - The command parser
   * @param key - The key to increment
   * @param increment - The floating-point value to increment by
   * @see https://redis.io/commands/incrbyfloat/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, increment: number) {
    parser.push('INCRBYFLOAT');
    parser.pushKey(key);
    parser.push(increment.toString());
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
