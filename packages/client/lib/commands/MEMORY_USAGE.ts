import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';

export interface MemoryUsageOptions {
  SAMPLES?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, options?: MemoryUsageOptions) {
    const args = ['MEMORY', 'USAGE', key];

    if (options?.SAMPLES) {
      args.push('SAMPLES', options.SAMPLES.toString());
    }
    
    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
