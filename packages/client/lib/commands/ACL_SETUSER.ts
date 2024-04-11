import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(username: RedisArgument, rule: RedisVariadicArgument) {
    return pushVariadicArguments(['ACL', 'SETUSER', username], rule);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
