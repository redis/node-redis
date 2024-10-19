import { CommandParser } from '@redis/client/lib/client/parser';
import { ArrayReply, TuplesReply, BlobStringReply, NullReply, UnwrapReply, Command } from '@redis/client/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, option: string) {
    parser.push('FT.CONFIG', 'GET', option);
  },
  transformReply(reply: UnwrapReply<ArrayReply<TuplesReply<[BlobStringReply, BlobStringReply | NullReply]>>>) {
    const transformedReply: Record<string, BlobStringReply | NullReply> = Object.create(null);
    for (const item of reply) {
      const [key, value] = item as unknown as UnwrapReply<typeof item>;
      transformedReply[key.toString()] = value;
    }

    return transformedReply;
  }
} as const satisfies Command;
