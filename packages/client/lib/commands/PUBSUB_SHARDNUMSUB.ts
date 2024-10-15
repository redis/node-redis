import { ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(channels?: RedisVariadicArgument) {
    const args = ['PUBSUB', 'SHARDNUMSUB'];

    if (channels) return pushVariadicArguments(args, channels);

    return args;
  },
  transformReply(reply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) {
    const transformedReply: Record<string, NumberReply> = Object.create(null);

    for (let i = 0; i < reply.length; i += 2) {
      transformedReply[(reply[i] as BlobStringReply).toString()] = reply[i + 1] as NumberReply;
    }
  
    return transformedReply;
  }
} as const satisfies Command;

