import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, SetReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Lists all existing indexes in the database.
   * @param parser - The command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('FT._LIST');
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
