import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
export interface XSetIdOptions {
  /** added in 7.0 */
  ENTRIESADDED?: number;
  /** added in 7.0 */
  MAXDELETEDID?: RedisArgument;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    lastId: RedisArgument,
    options?: XSetIdOptions
  ) {
    parser.push('XSETID');
    parser.pushKey(key);
    parser.push(lastId);

    if (options?.ENTRIESADDED) {
      parser.push('ENTRIESADDED', options.ENTRIESADDED.toString());
    }

    if (options?.MAXDELETEDID) {
      parser.push('MAXDELETEDID', options.MAXDELETEDID);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

