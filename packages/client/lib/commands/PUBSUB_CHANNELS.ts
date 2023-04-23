import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(pattern?: RedisArgument) {
    const args: Array<RedisArgument> = ['PUBSUB', 'CHANNELS'];

    if (pattern) {
      args.push(pattern);
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;

