import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(keys: RedisArgument | Array<RedisArgument>) {
    return pushVariadicArguments(['EXISTS'], keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
