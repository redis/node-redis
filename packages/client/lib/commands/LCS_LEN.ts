import { RedisArgument, NumberReply, Command } from '../RESP/types';
import LCS from './LCS';

export default {
  FIRST_KEY_INDEX: LCS.FIRST_KEY_INDEX,
  IS_READ_ONLY: LCS.IS_READ_ONLY,
  transformArguments(
    key1: RedisArgument,
    key2: RedisArgument
  ) {
    const args = LCS.transformArguments(key1, key2);
    args.push('LEN');
    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
