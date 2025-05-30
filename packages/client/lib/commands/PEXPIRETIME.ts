import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the PEXPIRETIME command
   * 
   * @param parser - The command parser
   * @param key - The key to get the expiration time for in milliseconds
   * @see https://redis.io/commands/pexpiretime/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('PEXPIRETIME');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
