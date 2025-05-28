import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, SetReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the distinct values in a TAG field.
   * @param parser - The command parser
   * @param index - Name of the index
   * @param fieldName - Name of the TAG field to get values from
   */
  parseCommand(parser: CommandParser, index: RedisArgument, fieldName: RedisArgument) {
    parser.push('FT.TAGVALS', index, fieldName);
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
