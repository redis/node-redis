import { Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';
import BLPOP from './BLPOP';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisVariadicArgument,
    timeout: number
  ) {
    const args = pushVariadicArguments(['BRPOP'], key);
    args.push(timeout.toString());
    return args;
  },
  transformReply: BLPOP.transformReply
} as const satisfies Command;
