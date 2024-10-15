import { RedisArgument, ArrayReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export function transformRankArguments(
  command: RedisArgument,
  key: RedisArgument,
  values: Array<number>
) {
  const args = [command, key];

  for (const value of values) {
    args.push(value.toString());
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments: transformRankArguments.bind(undefined, 'TDIGEST.RANK'),
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
