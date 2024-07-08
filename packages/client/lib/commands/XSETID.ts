import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
export interface XSetIdOptions {
  /** added in 7.0 */
  ENTRIESADDED?: number;
  /** added in 7.0 */
  MAXDELETEDID?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
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
      parser.pushVariadic(['ENTRIESADDED', options.ENTRIESADDED.toString()]);
    }

    if (options?.MAXDELETEDID) {
      parser.pushVariadic(['MAXDELETEDID', options.MAXDELETEDID]);
    }
  },
  transformArguments(key: RedisArgument, lastId: RedisArgument, options?: XSetIdOptions) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

