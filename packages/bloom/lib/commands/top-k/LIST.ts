import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TOPK.LIST');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
