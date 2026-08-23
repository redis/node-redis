import { CommandParser } from '../client/parser';
import { BlobStringReply, VerbatimStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'INFO');
  },
  transformReply: undefined as unknown as () => BlobStringReply | VerbatimStringReply
} as const satisfies Command;
