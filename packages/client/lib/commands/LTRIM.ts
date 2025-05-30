import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the LTRIM command
   * 
   * @param parser - The command parser
   * @param key - The key of the list
   * @param start - The starting index
   * @param stop - The ending index
   * @see https://redis.io/commands/ltrim/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, start: number, stop: number) {
    parser.push('LTRIM');
    parser.pushKey(key);
    parser.push(start.toString(), stop.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
