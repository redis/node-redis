import { BlobStringReply, Command, RedisArgument } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(script: RedisArgument) {
    return ['SCRIPT', 'LOAD', script];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
