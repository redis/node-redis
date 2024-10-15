import { RedisArgument, SimpleStringReply, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(message?: RedisArgument) {
    const args: Array<RedisArgument> = ['PING'];
    if (message) {
      args.push(message);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply | BlobStringReply
} as const satisfies Command;
