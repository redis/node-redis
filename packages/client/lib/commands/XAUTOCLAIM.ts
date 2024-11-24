import { CommandParser } from '../client/parser';
import { RedisArgument, TuplesReply, BlobStringReply, ArrayReply, NullReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { StreamMessageRawReply, transformStreamMessageNullReply } from './generic-transformers';

export interface XAutoClaimOptions {
  COUNT?: number;
}

export type XAutoClaimRawReply = TuplesReply<[
  nextId: BlobStringReply,
  messages: ArrayReply<StreamMessageRawReply | NullReply>,
  deletedMessages: ArrayReply<BlobStringReply>
]>;

export default {
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
    parser.push(group, consumer, minIdleTime.toString(), start);

    if (options?.COUNT) {
      parser.push('COUNT', options.COUNT.toString());
    }
  },
  transformReply(reply: UnwrapReply<XAutoClaimRawReply>, preserve?: any, typeMapping?: TypeMapping) {
    return {
      nextId: reply[0],
      messages: (reply[1] as unknown as UnwrapReply<typeof reply[1]>).map(transformStreamMessageNullReply.bind(undefined, typeMapping)),
      deletedMessages: reply[2]
    };
  }
} as const satisfies Command;
