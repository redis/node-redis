import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument) {
    parser.push('GETSET');
    parser.pushKey(key);
    parser.push(value);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
