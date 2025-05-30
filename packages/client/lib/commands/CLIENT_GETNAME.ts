import { CommandParser } from '../client/parser';
import { BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the name of the current connection
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CLIENT', 'GETNAME');
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
