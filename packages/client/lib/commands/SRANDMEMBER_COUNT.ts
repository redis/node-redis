import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import SRANDMEMBER from './SRANDMEMBER';

export default {
  FIRST_KEY_INDEX: SRANDMEMBER.FIRST_KEY_INDEX,
  IS_READ_ONLY: SRANDMEMBER.IS_READ_ONLY,
  transformArguments(key: RedisArgument, count: number) {
    const args = SRANDMEMBER.transformArguments(key);
    args.push(count.toString());
    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
