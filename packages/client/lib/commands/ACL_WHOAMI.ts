import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('ACL', 'WHOAMI');
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
