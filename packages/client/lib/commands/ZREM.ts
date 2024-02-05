import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    member: RedisVariadicArgument
  ) {
    return pushVariadicArguments(['ZREM', key], member);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
