import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('SPOP');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
