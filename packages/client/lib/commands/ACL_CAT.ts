import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, categoryName?: RedisArgument) {
    parser.pushVariadic(['ACL', 'CAT']);
    if (categoryName) {
      parser.push(categoryName);
    }
  },
  transformArguments(categoryName?: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
