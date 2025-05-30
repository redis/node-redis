import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the LRANGE command
   * 
   * @param parser - The command parser
   * @param key - The key of the list
   * @param start - The starting index
   * @param stop - The ending index
   * @see https://redis.io/commands/lrange/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, start: number, stop: number) {
    parser.push('LRANGE');
    parser.pushKey(key);
    parser.push(start.toString(), stop.toString())
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
