import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, items: RedisVariadicArgument) {
    parser.push('TOPK.ADD');
    parser.pushKey(key);
    parser.pushVariadic(items);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
