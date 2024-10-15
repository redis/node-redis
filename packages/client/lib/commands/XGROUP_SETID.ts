import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface XGroupSetIdOptions {
  /** added in 7.0 */
  ENTRIESREAD?: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    id: RedisArgument,
    options?: XGroupSetIdOptions
  ) {
    parser.push('XGROUP', 'SETID');
    parser.pushKey(key);
    parser.push(group, id);

    if (options?.ENTRIESREAD) {
      parser.push('ENTRIESREAD', options.ENTRIESREAD.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
