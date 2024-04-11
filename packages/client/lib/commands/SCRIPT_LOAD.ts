import { BlobStringReply, Command, RedisArgument } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(script: RedisArgument) {
    return ['SCRIPT', 'LOAD', script];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
