import { RedisArgument, TuplesReply, BlobStringReply, ArrayReply, NullReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { StreamMessageReply, transformStreamMessageNullReply } from './generic-transformers';

export interface XAutoClaimOptions {
  COUNT?: number;
}

export type XAutoClaimRawReply = TuplesReply<[
  nextId: BlobStringReply,
  messages: ArrayReply<StreamMessageReply | NullReply>,
  deletedMessages: ArrayReply<BlobStringReply>
]>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument,
    minIdleTime: number,
    start: RedisArgument,
    options?: XAutoClaimOptions
  ) {
    parser.push('XAUTOCLAIM');
    parser.pushKey(key);
    parser.pushVariadic([group, consumer, minIdleTime.toString(), start]);

    if (options?.COUNT) {
      parser.pushVariadic(['COUNT', options.COUNT.toString()]);
    }
  },
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument,
    minIdleTime: number,
    start: RedisArgument,
    options?: XAutoClaimOptions
  ) { return [] },
  transformReply(reply: UnwrapReply<XAutoClaimRawReply>) {
    return {
      nextId: reply[0],
      messages: (reply[1] as unknown as UnwrapReply<typeof reply[1]>).map(transformStreamMessageNullReply),
      deletedMessages: reply[2]
    };
  }
} as const satisfies Command;
