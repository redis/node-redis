import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('DUMP');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
