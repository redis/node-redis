import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

type ReplyItem = ArrayReply<BlobStringReply> | NullReply;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path?: RedisArgument) {
    const args = ['JSON.OBJKEYS', key];

    if (path) {
      args.push(path);
    }

    return args;
  },
  transformReply: undefined as unknown as () => ReplyItem | ArrayReply<ReplyItem>
} as const satisfies Command;
