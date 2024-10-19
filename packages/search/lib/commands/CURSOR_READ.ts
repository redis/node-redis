import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command, NumberReply, UnwrapReply } from '@redis/client/lib/RESP/types';
import AGGREGATE_WITHCURSOR from './AGGREGATE_WITHCURSOR';

export interface FtCursorReadOptions {
  COUNT?: number;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, index: RedisArgument, cursor: UnwrapReply<NumberReply>, options?: FtCursorReadOptions) {
    parser.push('FT.CURSOR', 'READ', index, cursor.toString());

    if (options?.COUNT !== undefined) {
      parser.push('COUNT', options.COUNT.toString());
    }
  },
  transformReply: AGGREGATE_WITHCURSOR.transformReply,
  unstableResp3: true
} as const satisfies Command;
