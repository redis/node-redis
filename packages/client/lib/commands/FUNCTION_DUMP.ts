import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns a serialized payload representing the current functions loaded in the server
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('FUNCTION', 'DUMP')
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
