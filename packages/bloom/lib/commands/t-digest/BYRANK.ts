import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/lib/RESP/types';
import { transformDoubleArrayReply } from '@redis/client/lib/commands/generic-transformers';

export function transformByRankArguments(
  parser: CommandParser, 
  key: RedisArgument,
  ranks: Array<number>
) {
  parser.pushKey(key);

  for (const rank of ranks) {
    parser.push(rank.toString());
  }
}

export default {
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof transformByRankArguments>) {
    args[0].push('TDIGEST.BYRANK');
    transformByRankArguments(...args);
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;

