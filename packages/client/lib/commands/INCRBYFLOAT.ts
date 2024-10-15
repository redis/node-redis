import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, increment: number) {
    parser.push('INCRBYFLOAT');
    parser.pushKey(key);
    parser.push(increment.toString());
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
