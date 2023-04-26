import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import ZRANDMEMBER from './ZRANDMEMBER';

export default {
  FIRST_KEY_INDEX: ZRANDMEMBER.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZRANDMEMBER.IS_READ_ONLY,
  transformArguments(key: RedisArgument, count: number) {
    const args = ZRANDMEMBER.transformArguments(key);
    args.push(count.toString());
    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
