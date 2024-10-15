import { TuplesReply, BlobStringReply, ArrayReply, UnwrapReply, Command } from '../RESP/types';
import XAUTOCLAIM from './XAUTOCLAIM';

type XAutoClaimJustIdRawReply = TuplesReply<[
  nextId: BlobStringReply,
  messages: ArrayReply<BlobStringReply>,
  deletedMessages: ArrayReply<BlobStringReply>
]>;

export default {
  IS_READ_ONLY: XAUTOCLAIM.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof XAUTOCLAIM.parseCommand>) {
    const parser = args[0];
    XAUTOCLAIM.parseCommand(...args);
    parser.push('JUSTID');
  },
  transformReply(reply: UnwrapReply<XAutoClaimJustIdRawReply>) {
    return {
      nextId: reply[0],
      messages: reply[1],
      deletedMessages: reply[2]
    };
  }
} as const satisfies Command;
