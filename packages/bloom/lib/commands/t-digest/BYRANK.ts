import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

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
  /**
   * Returns value estimates for one or more ranks in a t-digest sketch
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch
   * @param ranks - Array of ranks to get value estimates for (ascending order)
   */
  parseCommand(...args: Parameters<typeof transformByRankArguments>) {
    args[0].push('TDIGEST.BYRANK');
    transformByRankArguments(...args);
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;

