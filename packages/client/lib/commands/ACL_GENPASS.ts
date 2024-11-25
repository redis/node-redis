import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, bits?: number) {
    parser.push('ACL', 'GENPASS');
    if (bits) {
      parser.push(bits.toString());
    }
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;

