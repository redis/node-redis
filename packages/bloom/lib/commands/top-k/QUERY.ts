import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Checks if one or more items are in the Top-K list
   * @param parser - The command parser
   * @param key - The name of the Top-K filter
   * @param items - One or more items to check in the filter
   */
  parseCommand(parser: CommandParser, key: RedisArgument, items: RedisVariadicArgument) {
    parser.push('TOPK.QUERY');
    parser.pushKey(key);
    parser.pushVariadic(items);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
