import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the INCR command
   * 
   * @param parser - The command parser
   * @param key - The key to increment
   * @see https://redis.io/commands/incr/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('INCR');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
