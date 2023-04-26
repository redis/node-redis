import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, members: RedisVariadicArgument) {
    return pushVariadicArguments(['SREM', key], members);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
