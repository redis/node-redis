import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, items: RedisVariadicArgument) {
    parser.push('BF.MADD');
    parser.pushKey(key);
    parser.pushVariadic(items);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
