import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Returns a substring of the string stored at a key
   * @param parser - The Redis command parser
   * @param key - Key to get substring from
   * @param start - Start position of the substring
   * @param end - End position of the substring
   */
  parseCommand(parser: CommandParser, key: RedisArgument, start: number, end: number) {
    parser.push('GETRANGE');
    parser.pushKey(key);
    parser.push(start.toString(), end.toString());
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
