import { Command, NumberReply, RedisArgument } from '../RESP/types';

export default {
  transformArguments(key: RedisArgument) {
    return ['CLUSTER', 'KEYSLOT', key];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
