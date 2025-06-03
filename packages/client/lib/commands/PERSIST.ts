import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the PERSIST command
   * 
   * @param parser - The command parser
   * @param key - The key to remove the expiration from
   * @see https://redis.io/commands/persist/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('PERSIST');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
