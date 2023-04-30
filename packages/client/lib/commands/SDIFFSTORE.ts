import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    destination: RedisArgument,
    keys: Array<RedisArgument> | RedisArgument
  ) {
    return pushVariadicArguments(['SDIFFSTORE', destination], keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
