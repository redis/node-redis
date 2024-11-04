import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, NumberReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, items: RedisVariadicArgument) {
    parser.push('CMS.QUERY');
    parser.pushKey(key);
    parser.pushVariadic(items);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
