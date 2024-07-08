import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, index: number) {
    parser.setCachable();
    parser.push('LINDEX');
    parser.pushKey(key);
    parser.push(index.toString());
  },
  transformArguments(key: RedisArgument, index: number) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
