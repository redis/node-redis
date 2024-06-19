import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument) {
    parser.push('GETSET');
    parser.pushKey(key);
    parser.push(value);
  },
  transformArguments(key: RedisArgument, value: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
