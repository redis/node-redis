import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the RENAME command
   * 
   * @param parser - The command parser
   * @param key - The key to rename
   * @param newKey - The new key name
   * @see https://redis.io/commands/rename/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, newKey: RedisArgument) {
    parser.push('RENAME');
    parser.pushKeys([key, newKey]);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
