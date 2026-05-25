import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, SetReply, UnwrapReply, Command } from '../RESP/types';

export type CommandGetKeysAndFlagsRawReply = ArrayReply<TuplesReply<[
  key: BlobStringReply,
  flags: SetReply<BlobStringReply>
]>>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, args: Array<RedisArgument>) {
    parser.push('COMMAND', 'GETKEYSANDFLAGS');
    parser.push(...args);
  },
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
