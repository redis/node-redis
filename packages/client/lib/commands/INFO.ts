import { CommandParser } from '../client/parser';
import { RedisArgument, VerbatimStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, section?: RedisArgument) {
    parser.push('INFO');

    if (section) {
      parser.push(section);
    }
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
