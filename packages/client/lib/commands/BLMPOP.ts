import { RedisArgument, Command } from '../RESP/types';
import { transformLMPopArguments, LMPopOptions, ListSide } from './generic-transformers';
import LMPOP from './LMPOP';

export default {
  FIRST_KEY_INDEX: 3,
  IS_READ_ONLY: false,
  transformArguments(
    timeout: number,
    keys: RedisArgument | Array<RedisArgument>,
    side: ListSide,
    options?: LMPopOptions
  ) {
    return transformLMPopArguments(
      ['BLMPOP', timeout.toString()],
      keys,
      side,
      options
    );
  },
  transformReply: LMPOP.transformReply
} as const satisfies Command;
