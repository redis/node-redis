import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the RENAMENX command
   * 
   * @param parser - The command parser
   * @param key - The key to rename
   * @param newKey - The new key name, if it doesn't exist
   * @see https://redis.io/commands/renamenx/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, newKey: RedisArgument) {
    parser.push('RENAMENX');
    parser.pushKeys([key, newKey]);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
