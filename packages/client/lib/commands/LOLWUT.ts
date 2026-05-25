import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, version?: number, ...optionalArguments: Array<number>) {
    parser.push('LOLWUT');
    if (version) {
      parser.push(
        'VERSION',
        version.toString()
      );
      parser.pushVariadic(optionalArguments.map(String));
    }
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
