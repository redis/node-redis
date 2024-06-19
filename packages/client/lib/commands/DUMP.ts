import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('DUMP');
    parser.pushKey(key);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
