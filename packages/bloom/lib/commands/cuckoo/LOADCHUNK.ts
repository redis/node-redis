import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Restores a Cuckoo Filter chunk previously saved using SCANDUMP
   * @param parser - The command parser
   * @param key - The name of the Cuckoo filter to restore
   * @param iterator - Iterator value from the SCANDUMP command
   * @param chunk - Data chunk from the SCANDUMP command
   */
  parseCommand(parser: CommandParser, key: RedisArgument, iterator: number, chunk: RedisArgument) {
    parser.push('CF.LOADCHUNK');
    parser.pushKey(key);
    parser.push(iterator.toString(), chunk);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
