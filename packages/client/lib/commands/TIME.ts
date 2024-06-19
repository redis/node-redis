import { BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('TIME');
  },
  transformArguments() { return [] },
  transformReply: undefined as unknown as () => [
    unixTimestamp: BlobStringReply<`${number}`>,
    microseconds: BlobStringReply<`${number}`>
  ]
} as const satisfies Command;
