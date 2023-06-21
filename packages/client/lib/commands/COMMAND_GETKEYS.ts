import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(args: Array<RedisArgument>) {
    return ['COMMAND', 'GETKEYS', ...args];
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
