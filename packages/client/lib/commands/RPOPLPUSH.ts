import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument) {
    parser.push('RPOPLPUSH');
    parser.pushKeys([source, destination]);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
