import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.setCachable();
    parser.push('HKEYS')
    parser.pushKey(key);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
