import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '@redis/client/lib/RESP/types';

export function transformRankArguments(
  parser: CommandParser,
  key: RedisArgument,
  values: Array<number>
) {
  parser.pushKey(key);

  for (const value of values) {
    parser.push(value.toString());
  }
}

export default {
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof transformRankArguments>) {
    args[0].push('TDIGEST.RANK');
    transformRankArguments(...args);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
