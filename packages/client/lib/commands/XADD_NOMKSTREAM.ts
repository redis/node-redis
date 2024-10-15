import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { XAddOptions, pushXAddArguments } from './XADD';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    id: RedisArgument,
    message: Record<string, RedisArgument>,
    options?: XAddOptions
  ) {
    return pushXAddArguments(['XADD', key, 'NOMKSTREAM'], id, message, options);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
