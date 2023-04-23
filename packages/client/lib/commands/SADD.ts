import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    members: Array<RedisArgument> | RedisArgument
  ) {
    return pushVariadicArguments(['SADD', key], members);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
