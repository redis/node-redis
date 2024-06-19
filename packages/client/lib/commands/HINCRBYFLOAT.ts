import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) {
    parser.push('HINCRBYFLOAT');
    parser.pushKey(key);
    parser.pushVariadic([field, increment.toString()]);
  },
  transformArguments(
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
