import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('RPOP');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformArguments(key: RedisArgument, count: number) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply> | NullReply
} as const satisfies Command;
