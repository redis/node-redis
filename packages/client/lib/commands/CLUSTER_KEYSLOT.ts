import { Command, NumberReply, RedisArgument } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['CLUSTER', 'KEYSLOT', key];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
