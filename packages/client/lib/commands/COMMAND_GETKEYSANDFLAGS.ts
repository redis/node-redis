import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, SetReply, Command } from '../RESP/types';

export type CommandGetKeysAndFlagsRawReply = ArrayReply<TuplesReply<[
  key: BlobStringReply,
  flags: SetReply<BlobStringReply>
]>>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(args: Array<RedisArgument>) {
    return ['COMMAND', 'GETKEYSANDFLAGS', ...args];
  },
  transformReply(reply: CommandGetKeysAndFlagsRawReply) {
    return reply.map(([key, flags]) => ({
      key,
      flags
    }));
  }
} as const satisfies Command;
