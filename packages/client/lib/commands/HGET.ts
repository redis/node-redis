import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, field: RedisArgument) {
    parser.push('HGET');
    parser.pushKey(key);
    parser.push(field);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
