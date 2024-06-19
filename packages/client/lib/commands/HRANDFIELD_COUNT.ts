import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('HRANDFIELD');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformArguments(key: RedisArgument, count: number) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
