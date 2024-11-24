import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) {
    parser.push('HINCRBYFLOAT');
    parser.pushKey(key);
    parser.push(field, increment.toString());
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
