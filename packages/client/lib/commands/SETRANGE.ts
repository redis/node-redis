import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the SETRANGE command
   * 
   * @param parser - The command parser
   * @param key - The key to modify
   * @param offset - The offset at which to start writing
   * @param value - The value to write at the offset
   * @see https://redis.io/commands/setrange/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, offset: number, value: RedisArgument) {
    parser.push('SETRANGE');
    parser.pushKey(key);
    parser.push(offset.toString(), value);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
