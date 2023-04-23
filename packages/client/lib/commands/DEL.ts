import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(keys: RedisArgument | Array<RedisArgument>) {
    return pushVariadicArguments(['DEL'], keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
