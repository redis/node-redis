import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    destination: RedisArgument,
    source?: RedisVariadicArgument
  ) {
    const args = ['PFMERGE', destination];
    if (!source) return args;

    return pushVariadicArguments(args, source);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
