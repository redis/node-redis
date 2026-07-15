import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, message: RedisArgument) {
    parser.push('ECHO', message);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
