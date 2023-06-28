import { RedisArgument, TuplesReply, BlobStringReply, ArrayReply, Command } from '../RESP/types';
import { StreamMessagesRawReply, transformStreamMessagesReply } from './generic-transformers';

export interface XAutoClaimOptions {
  COUNT?: number;
}

export type XAutoClaimRawReply = TuplesReply<[
  nextId: BlobStringReply,
  messages: StreamMessagesRawReply,
  deletedMessages: ArrayReply<BlobStringReply>
]>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument,
    minIdleTime: number,
    start: RedisArgument,
    options?: XAutoClaimOptions
  ) {
    const args = [
      'XAUTOCLAIM',
      key,
      group,
      consumer,
      minIdleTime.toString(),
      start
    ];

    if (options?.COUNT) {
      args.push('COUNT', options.COUNT.toString());
    }

    return args;
  },
  transformReply(reply: XAutoClaimRawReply) {
    return {
      nextId: reply[0],
      messages: transformStreamMessagesReply(reply[1]),
      deletedMessages: reply[2]
    };
  }
} as const satisfies Command;
