import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument, NumberReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Deletes a cursor from an index.
   * @param parser - The command parser
   * @param index - The index name that contains the cursor
   * @param cursorId - The cursor ID to delete
   */
  parseCommand(parser: CommandParser, index: RedisArgument, cursorId: UnwrapReply<NumberReply>) {
    parser.push('FT.CURSOR', 'DEL', index, cursorId.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
