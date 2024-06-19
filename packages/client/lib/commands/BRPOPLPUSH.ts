import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, timeout: number) {
    parser.push('BRPOPLPUSH');
    parser.pushKeys([source, destination]);
    parser.push(timeout.toString());
  },
  transformArguments(
    source: RedisArgument,
    destination: RedisArgument,
    timeout: number
  ) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
