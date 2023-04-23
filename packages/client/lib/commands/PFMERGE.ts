import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    destination: RedisArgument,
    source?: RedisArgument | Array<RedisArgument>
  ) {
    return pushVariadicArguments(['PFMERGE', destination], source);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
