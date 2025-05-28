import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, MapReply, BlobStringReply, ArrayReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Dumps the contents of a synonym group.
   * @param parser - The command parser
   * @param index - Name of the index that contains the synonym group
   */
  parseCommand(parser: CommandParser, index: RedisArgument) {
    parser.push('FT.SYNDUMP', index);
  },
  transformReply: {
    2: (reply: UnwrapReply<ArrayReply<BlobStringReply | ArrayReply<BlobStringReply>>>) => {
      const result: Record<string, ArrayReply<BlobStringReply>> = {};
      let i = 0;
      while (i < reply.length) {
        const key = (reply[i++] as unknown as UnwrapReply<BlobStringReply>).toString(),
          value = reply[i++] as unknown as ArrayReply<BlobStringReply>;
        result[key] = value;
      }
      return result;
    },
    3: undefined as unknown as () => MapReply<BlobStringReply, ArrayReply<BlobStringReply>>
  }
} as const satisfies Command;
