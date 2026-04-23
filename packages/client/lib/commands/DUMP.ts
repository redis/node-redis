import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('DUMP');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
