import { RedisArgument, VerbatimStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, section?: RedisArgument) {
    parser.push('INFO');

    if (section) {
      parser.push(section);
    }
  },
  transformArguments(section?: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
