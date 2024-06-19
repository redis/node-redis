import { RedisArgument, ArrayReply, BlobStringReply, SetReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.setCachable();
    parser.push('SMEMBERS');
    parser.pushKey(key);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
