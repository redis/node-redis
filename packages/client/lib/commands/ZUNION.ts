import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArgument } from './generic-transformers';

export interface ZUnionOptions {
  WEIGHTS?: Array<number>;
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(
    keys: RedisVariadicArgument,
    options?: ZUnionOptions
  ) {
    const args = pushVariadicArgument(['ZUNION'], keys);

    if (options?.WEIGHTS) {
      args.push('WEIGHTS', ...options.WEIGHTS.map(weight => weight.toString()));
    }

    if (options?.AGGREGATE) {
      args.push('AGGREGATE', options.AGGREGATE);
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
