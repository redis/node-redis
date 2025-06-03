import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the PTTL command
   * 
   * @param parser - The command parser
   * @param key - The key to get the time to live in milliseconds
   * @see https://redis.io/commands/pttl/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('PTTL');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
