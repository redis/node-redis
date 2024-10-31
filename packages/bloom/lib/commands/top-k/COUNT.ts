import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, items: RedisVariadicArgument) {
    parser.push('TOPK.COUNT');
    parser.pushKey(key);
    parser.pushVariadic(items);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
