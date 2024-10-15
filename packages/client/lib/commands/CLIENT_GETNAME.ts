import { CommandParser } from '../client/parser';
import { BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('CLIENT', 'GETNAME');
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
