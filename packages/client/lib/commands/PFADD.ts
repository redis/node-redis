import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, element?: RedisVariadicArgument) {
    const args = ['PFADD', key];
    if (!element) return args;

    return pushVariadicArguments(args, element);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
