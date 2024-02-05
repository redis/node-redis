import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(username: RedisVariadicArgument) {
    return pushVariadicArguments(['ACL', 'DELUSER'], username);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
