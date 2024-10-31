import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, iterator: number, chunk: RedisArgument) {
    parser.push('BF.LOADCHUNK');
    parser.pushKey(key);
    parser.push(iterator.toString(), chunk);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
