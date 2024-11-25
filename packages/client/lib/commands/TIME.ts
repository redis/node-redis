import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('TIME');
  },
  transformReply: undefined as unknown as () => [
    unixTimestamp: BlobStringReply<`${number}`>,
    microseconds: BlobStringReply<`${number}`>
  ]
} as const satisfies Command;
