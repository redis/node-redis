import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

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
  /**
   * Returns the rank of one or more values in a t-digest sketch (number of values that are lower than each value)
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch
   * @param values - Array of values to get ranks for
   */
  parseCommand(...args: Parameters<typeof transformRankArguments>) {
    args[0].push('TDIGEST.RANK');
    transformRankArguments(...args);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
