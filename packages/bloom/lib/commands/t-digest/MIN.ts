import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/lib/RESP/types';
import { transformDoubleReply } from '@redis/client/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TDIGEST.MIN');
    parser.pushKey(key);
  },
  transformReply: transformDoubleReply
} as const satisfies Command;
