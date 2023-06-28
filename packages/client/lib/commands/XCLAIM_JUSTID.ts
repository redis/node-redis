import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import XCLAIM from './XCLAIM';

export default {
  FIRST_KEY_INDEX: XCLAIM.FIRST_KEY_INDEX,
  IS_READ_ONLY: XCLAIM.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof XCLAIM.transformArguments>) {
    const redisArgs = XCLAIM.transformArguments(...args);
    redisArgs.push('JUSTID');
    return redisArgs;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
