import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArgument } from './generic-transformers';

export interface ZInterCardOptions {
  LIMIT?: number;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(
    keys: RedisVariadicArgument,
    options?: ZInterCardOptions['LIMIT'] | ZInterCardOptions
  ) {
    const args = pushVariadicArgument(['ZINTERCARD'], keys);

    // backwards compatibility
    if (typeof options === 'number') {
      args.push('LIMIT', options.toString());
    } else if (options?.LIMIT) {
      args.push('LIMIT', options.LIMIT.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
