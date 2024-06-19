import { TuplesReply, BlobStringReply, ArrayReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import XAUTOCLAIM from './XAUTOCLAIM';
import { Tail } from './generic-transformers';

type XAutoClaimJustIdRawReply = TuplesReply<[
  nextId: BlobStringReply,
  messages: ArrayReply<BlobStringReply>,
  deletedMessages: ArrayReply<BlobStringReply>
]>;

export default {
  FIRST_KEY_INDEX: XAUTOCLAIM.FIRST_KEY_INDEX,
  IS_READ_ONLY: XAUTOCLAIM.IS_READ_ONLY,
  parseCommand(parser: CommandParser, ...args: Tail<Parameters<typeof XAUTOCLAIM.parseCommand>>) {
    XAUTOCLAIM.parseCommand(parser, ...args);
    parser.push('JUSTID');
  },
  transformArguments(...args: Parameters<typeof XAUTOCLAIM.transformArguments>) { return [] },
  transformReply(reply: UnwrapReply<XAutoClaimJustIdRawReply>) {
    return {
      nextId: reply[0],
      messages: reply[1],
      deletedMessages: reply[2]
    };
  }
} as const satisfies Command;
