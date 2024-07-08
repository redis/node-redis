import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, library: RedisArgument) {
    parser.pushVariadic(['FUNCTION', 'DELETE', library]);
  },
  transformArguments(library: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
