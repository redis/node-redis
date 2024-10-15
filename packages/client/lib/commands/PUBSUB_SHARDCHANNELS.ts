import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(pattern?: RedisArgument) {
    const args: Array<RedisArgument> = ['PUBSUB', 'SHARDCHANNELS'];

    if (pattern) {
      args.push(pattern);
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
