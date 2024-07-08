import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface XGroupSetIdOptions {
  /** added in 7.0 */
  ENTRIESREAD?: number;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    id: RedisArgument,
    options?: XGroupSetIdOptions
  ) {
    parser.pushVariadic(['XGROUP', 'SETID']);
    parser.pushKey(key);
    parser.pushVariadic([group, id]);

    if (options?.ENTRIESREAD) {
      parser.pushVariadic(['ENTRIESREAD', options.ENTRIESREAD.toString()]);
    }
  },
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    id: RedisArgument,
    options?: XGroupSetIdOptions
  ) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
