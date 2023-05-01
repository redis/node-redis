import { BlobStringReply, NullReply, Command } from '../RESP/types';
import XADD from './XADD';

export default {
  FIRST_KEY_INDEX: XADD.FIRST_KEY_INDEX,
  IS_READ_ONLY: XADD.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof XADD.transformArguments>) {
    const redisArgs = XADD.transformArguments(...args);
    redisArgs.push('NOMKSTREAM');
    return redisArgs;
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
