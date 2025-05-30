import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Lists ACL categories or commands in a category
   * @param parser - The Redis command parser
   * @param categoryName - Optional category name to filter commands
   */
  parseCommand(parser: CommandParser, categoryName?: RedisArgument) {
    parser.push('ACL', 'CAT');
    if (categoryName) {
      parser.push(categoryName);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
