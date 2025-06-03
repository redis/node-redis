import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the SETNX command
   * 
   * @param parser - The command parser
   * @param key - The key to set if it doesn't exist
   * @param value - The value to set
   * @see https://redis.io/commands/setnx/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument) {
    parser.push('SETNX');
    parser.pushKey(key);
    parser.push(value);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
