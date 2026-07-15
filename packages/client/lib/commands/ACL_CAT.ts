import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, categoryName?: RedisArgument) {
    parser.push('ACL', 'CAT');
    if (categoryName) {
      parser.push(categoryName);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
