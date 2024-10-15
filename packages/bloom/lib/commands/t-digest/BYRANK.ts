import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export function transformByRankArguments(
  command: RedisArgument,
  key: RedisArgument,
  ranks: Array<number>
) {
  const args = [command, key];

  for (const rank of ranks) {
    args.push(rank.toString());
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments: transformByRankArguments.bind(undefined, 'TDIGEST.BYRANK'),
  transformReply: transformDoubleArrayReply
} as const satisfies Command;

