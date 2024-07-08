import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument) {
    parser.push('RPOPLPUSH');
    parser.pushKeys([source, destination]);
  },
  transformArguments(source: RedisArgument, destination: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
