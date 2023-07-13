import { TuplesReply, BlobStringReply, ArrayReply, UnwrapReply, Command } from '../RESP/types';
import XAUTOCLAIM from './XAUTOCLAIM';

type XAutoClaimJustIdRawReply = TuplesReply<[
  nextId: BlobStringReply,
  messages: ArrayReply<BlobStringReply>,
  deletedMessages: ArrayReply<BlobStringReply>
]>;

export default {
  FIRST_KEY_INDEX: XAUTOCLAIM.FIRST_KEY_INDEX,
  IS_READ_ONLY: XAUTOCLAIM.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof XAUTOCLAIM.transformArguments>) {
    const redisArgs = XAUTOCLAIM.transformArguments(...args);
    redisArgs.push('JUSTID');
    return redisArgs;
  },
  transformReply(reply: UnwrapReply<XAutoClaimJustIdRawReply>) {
    return {
      nextId: reply[0],
      messages: reply[1],
      deletedMessages: reply[2]
    };
  }
} as const satisfies Command;
