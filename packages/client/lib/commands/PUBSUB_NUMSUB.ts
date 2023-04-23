import { RedisArgument, ArrayReply, BlobStringReply, NumberReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(channels?: RedisArgument | Array<RedisArgument>) {
    const args = ['PUBSUB', 'NUMSUB'];

    if (channels) return pushVariadicArguments(args, channels);

    return args;
  },
  transformReply(rawReply: ArrayReply<BlobStringReply | NumberReply>) {
    const reply = Object.create(null);
    let i = 0;
    while (i < rawReply.length) {
      reply[rawReply[i++].toString()] = rawReply[i++].toString();
    }

    return reply as Record<string, NumberReply>;
  }
} as const satisfies Command;
