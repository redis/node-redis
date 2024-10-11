import { NullReply, BlobStringReply, ArrayReply, Command, RedisArgument, UnwrapReply } from '@redis/client/dist/lib/RESP/types';

export interface JsonTypeOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, options?: JsonTypeOptions) {
    const args = ['JSON.TYPE', key];

    if (options?.path) {
      args.push(options.path);
    }

    return args;
  },
  transformReply: {
    2: undefined as unknown as () => NullReply | BlobStringReply | ArrayReply<BlobStringReply | NullReply>,
    // TODO: RESP3 wraps the response in another array, but only returns 1 
    3: (reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply | ArrayReply<BlobStringReply | NullReply>>>) => {
      return reply[0];
    }
  },
} as const satisfies Command;

