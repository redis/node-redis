import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/lib/RESP/types';
import { transformDoubleArrayReply } from '@redis/client/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, values: Array<number>) {
    parser.push('TDIGEST.CDF');
    parser.pushKey(key);

    for (const item of values) {
      parser.push(item.toString());
    }
  },
  transformReply: transformDoubleArrayReply
} as const satisfies Command;
