import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, NumberReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import AGGREGATE_WITHCURSOR from './AGGREGATE_WITHCURSOR';

export interface FtCursorReadOptions {
  COUNT?: number;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Reads from an existing cursor to get more results from an index.
   * @param parser - The command parser
   * @param index - The index name that contains the cursor
   * @param cursor - The cursor ID to read from
   * @param options - Optional parameters:
   *   - COUNT: Maximum number of results to return
   */
  parseCommand(parser: CommandParser, index: RedisArgument, cursor: UnwrapReply<NumberReply>, options?: FtCursorReadOptions) {
    parser.push('FT.CURSOR', 'READ', index, cursor.toString());

    if (options?.COUNT !== undefined) {
      parser.push('COUNT', options.COUNT.toString());
    }
  },
  transformReply: AGGREGATE_WITHCURSOR.transformReply,
  unstableResp3: true
} as const satisfies Command;
