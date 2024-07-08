import { RedisArgument, NullReply, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('LPOP');
    parser.pushKey(key);
    parser.push(count.toString())
  },
  transformArguments(key: RedisArgument, count: number) { return [] },
  transformReply: undefined as unknown as () => NullReply | ArrayReply<BlobStringReply>
} as const satisfies Command;
