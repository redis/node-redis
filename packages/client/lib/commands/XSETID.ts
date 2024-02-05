import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
export interface XSetIdOptions {
  /** added in 7.0 */
  ENTRIESADDED?: number;
  /** added in 7.0 */
  MAXDELETEDID?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    lastId: RedisArgument,
    options?: XSetIdOptions
  ) {
    const args = ['XSETID', key, lastId];

    if (options?.ENTRIESADDED) {
      args.push('ENTRIESADDED', options.ENTRIESADDED.toString());
    }

    if (options?.MAXDELETEDID) {
      args.push('MAXDELETEDID', options.MAXDELETEDID);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

