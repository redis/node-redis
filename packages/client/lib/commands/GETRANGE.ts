import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, start: number, end: number) {
    parser.setCachable();
    parser.push('GETRANGE');
    parser.pushKey(key);
    parser.push(start.toString());
    parser.push(end.toString());
  },
  transformArguments(key: RedisArgument, start: number, end: number) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
