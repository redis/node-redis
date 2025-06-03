import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Deletes a string from a suggestion dictionary.
   * @param parser - The command parser
   * @param key - The suggestion dictionary key
   * @param string - The suggestion string to delete
   */
  parseCommand(parser: CommandParser, key: RedisArgument, string: RedisArgument) {
    parser.push('FT.SUGDEL');
    parser.pushKey(key);
    parser.push(string);
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
