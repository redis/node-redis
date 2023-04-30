import { RedisArgument, VerbatimStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments(section?: RedisArgument) {
    const args: Array<RedisArgument> = ['INFO'];

    if (section) {
      args.push(section);
    }

    return args;
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
