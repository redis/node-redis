import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments(message?: RedisArgument) {
    const args: Array<RedisArgument> = ['PING'];
    if (message) {
      args.push(message);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
