import { SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(key: RedisVariadicArgument) {
    return pushVariadicArguments(['WATCH'], key);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
