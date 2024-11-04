import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    lowCutPercentile: number,
    highCutPercentile: number
  ) {
    parser.push('TDIGEST.TRIMMED_MEAN');
    parser.pushKey(key);
    parser.push(lowCutPercentile.toString(), highCutPercentile.toString());
  },
  transformReply: transformDoubleReply
} as const satisfies Command;
