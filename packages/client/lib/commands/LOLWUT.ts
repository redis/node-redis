import { BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, version?: number, ...optionalArguments: Array<number>) {
    parser.push('LOLWUT');
    if (version) {
      parser.pushVariadic(
        [
          'VERSION',
          version.toString(),
          ...optionalArguments.map(String),
        ]
      );
    }
  },
  transformArguments(version?: number, ...optionalArguments: Array<number>) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
