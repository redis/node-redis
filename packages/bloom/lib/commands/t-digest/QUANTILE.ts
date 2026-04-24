import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, quantiles: Array<number>) {
    parser.push('TDIGEST.QUANTILE');
    parser.pushKey(key);

    for (const quantile of quantiles) {
      parser.push(quantile.toString());
    }
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;
