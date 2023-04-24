import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(sha1: RedisArgument | Array<RedisArgument>) {
    return pushVariadicArguments(['SCRIPT', 'EXISTS'], sha1);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
