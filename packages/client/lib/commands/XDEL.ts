import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, id: RedisVariadicArgument) {
    return pushVariadicArguments(['XDEL', key], id);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
