import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, quantiles: Array<number>) {
    const args = ['TDIGEST.QUANTILE', key];

    for (const quantile of quantiles) {
      args.push(quantile.toString());
    }

    return args;
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;
