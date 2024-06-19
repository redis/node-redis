import { BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.pushVariadic(['LATENCY', 'DOCTOR']);
  },
  transformArguments() {
    return ['LATENCY', 'DOCTOR'];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
