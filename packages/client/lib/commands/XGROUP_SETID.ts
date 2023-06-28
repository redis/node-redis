import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface XGroupSetIdOptions {
  /** added in 7.0 */
  ENTRIESREAD?: number;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    id: RedisArgument,
    options?: XGroupSetIdOptions
  ) {
    const args = ['XGROUP', 'SETID', key, group, id];

    if (options?.ENTRIESREAD) {
      args.push('ENTRIESREAD', options.ENTRIESREAD.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
