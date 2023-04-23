import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(path: RedisArgument, moduleArguments?: Array<RedisArgument>) {
    return pushVariadicArguments(['MODULE', 'LOAD', path], moduleArguments);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
