import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'MYID');
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
