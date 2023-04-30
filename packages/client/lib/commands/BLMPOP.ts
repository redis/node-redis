import { Command } from '../RESP/types';
import { transformLMPopArguments, LMPopOptions, ListSide, RedisVariadicArgument } from './generic-transformers';
import LMPOP from './LMPOP';

export default {
  FIRST_KEY_INDEX: 3,
  IS_READ_ONLY: false,
  transformArguments(
    timeout: number,
    keys: RedisVariadicArgument,
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
