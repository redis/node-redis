import { RedisArgument, NumberReply, Command, } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArgument } from './generic-transformers';

export interface ZUnionOptions {
  WEIGHTS?: Array<number>;
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    destination: RedisArgument,
    keys: RedisVariadicArgument,
    options?: ZUnionOptions
  ) {
    const args = pushVariadicArgument(['ZUNIONSTORE', destination], keys);

    if (options?.WEIGHTS) {
      args.push('WEIGHTS', ...options.WEIGHTS.map(weight => weight.toString()));
    }

    if (options?.AGGREGATE) {
      args.push('AGGREGATE', options.AGGREGATE);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
