import { CommandParser } from '@redis/client/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, values: Array<number>) {
    parser.push('TDIGEST.ADD');
    parser.pushKey(key);

    for (const value of values) {
      parser.push(value.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
