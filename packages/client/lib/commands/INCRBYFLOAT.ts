import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, increment: number) {
    parser.push('INCRBYFLOAT');
    parser.pushKey(key);
    parser.push(increment.toString());
  },
  transformArguments(key: RedisArgument, increment: number) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
