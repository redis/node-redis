import { ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(channels?: RedisVariadicArgument) {
    const args = ['PUBSUB', 'NUMSUB'];

    if (channels) return pushVariadicArguments(args, channels);

    return args;
  },
  transformReply(rawReply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) {
    const reply = Object.create(null);
    let i = 0;
    while (i < rawReply.length) {
      reply[rawReply[i++].toString()] = rawReply[i++].toString();
    }

    return reply as Record<string, NumberReply>;
  }
} as const satisfies Command;
