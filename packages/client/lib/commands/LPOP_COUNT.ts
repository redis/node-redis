import { CommandParser } from '../client/parser';
import { RedisArgument, NullReply, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import LPOP from './LPOP';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the LPOP command with count parameter
   * 
   * @param parser - The command parser
   * @param key - The key of the list to pop from
   * @param count - The number of elements to pop
   * @see https://redis.io/commands/lpop/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    LPOP.parseCommand(parser, key);
    parser.push(count.toString())
  },
  transformReply: undefined as unknown as () => NullReply | ArrayReply<BlobStringReply>
} as const satisfies Command;
