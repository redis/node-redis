import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, SetReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export type CommandGetKeysAndFlagsRawReply = ArrayReply<TuplesReply<[
  key: BlobStringReply,
  flags: SetReply<BlobStringReply>
]>>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, args: Array<RedisArgument>) {
    parser.pushVariadic(['COMMAND', 'GETKEYSANDFLAGS', ...args]);
  },
  transformArguments(args: Array<RedisArgument>) { return [] },
  transformReply(reply: UnwrapReply<CommandGetKeysAndFlagsRawReply>) {
    return reply.map(entry => {
      const [key, flags] = entry as unknown as UnwrapReply<typeof entry>;
      return {
        key,
        flags
      };
    });
  }
} as const satisfies Command;
