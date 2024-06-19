import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('RPOP');
    parser.pushKey(key);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
