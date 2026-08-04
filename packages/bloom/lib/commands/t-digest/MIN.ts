import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TDIGEST.MIN');
    parser.pushKey(key);
  },
  transformReply: transformDoubleReply
} as const satisfies Command;
