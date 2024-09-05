import { NumberReply, Command, RedisArgument } from '../RESP/types';

export interface XTrimOptions {
  strategyModifier?: '=' | '~';
  /** added in 6.2 */
  LIMIT?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    strategy: 'MAXLEN' | 'MINID',
    threshold: number | string,
    options?: XTrimOptions
  ) {
    const args = ['XTRIM', key, strategy];

    if (options?.strategyModifier) {
      args.push(options.strategyModifier);
    }

    args.push(threshold.toString());

    if (options?.LIMIT) {
      args.push('LIMIT', options.LIMIT.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
