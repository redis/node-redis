import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    ms: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    const args = ['PEXPIRE', key, ms.toString()];

    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
