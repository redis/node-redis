import { VerbatimStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.pushVariadic(['CLUSTER', 'NODES']);
  },
  transformArguments() { return [] },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
