import { BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, bits?: number) {
    parser.pushVariadic(['ACL', 'GENPASS']);
    if (bits) {
      parser.push(bits.toString());
    }
  },
  transformArguments(bits?: number) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;

