import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface XGroupCreateOptions {
  MKSTREAM?: boolean;
  /**
   * added in 7.0
   */
  ENTRIESREAD?: number;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    id: RedisArgument,
    options?: XGroupCreateOptions
  ) {
    const args = ['XGROUP', 'CREATE', key, group, id];

    if (options?.MKSTREAM) {
      args.push('MKSTREAM');
    }

    if (options?.ENTRIESREAD) {
      args.push('ENTRIESREAD', options.ENTRIESREAD.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

