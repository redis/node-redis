import { ArrayReply, Command, NullReply, NumberReply, RedisArgument } from '../RESP/types';
import { pushVariadicArgument, RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, fields: RedisVariadicArgument) {
    return pushVariadicArgument(['HPEXPIRETIME', key, 'FIELDS'], fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply> | NullReply
} as const satisfies Command;