import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(categoryName?: RedisArgument) {
    const args: Array<RedisArgument> = ['ACL', 'CAT'];

    if (categoryName) {
      args.push(categoryName);
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
