import { RedisArgument, NumberReply, Command } from '../RESP/types';
import SORT, { SortOptions } from './SORT';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    source: RedisArgument,
    destination: RedisArgument,
    options?: SortOptions
  ) {
    const args = SORT.transformArguments(source, options);
    args.push('STORE', destination);
    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
