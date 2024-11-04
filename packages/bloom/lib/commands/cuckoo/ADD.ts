import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformBooleanReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, item: RedisArgument) {
    parser.push('CF.ADD');
    parser.pushKey(key);
    parser.push(item);
  },
  transformReply: transformBooleanReply
} as const satisfies Command;
