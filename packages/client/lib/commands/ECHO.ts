import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, message: RedisArgument) {
    parser.push('ECHO', message);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
