import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  /**
   * Increments the float value of a field in a hash by the given amount
   * @param parser - The Redis command parser
   * @param key - Key of the hash
   * @param field - Field to increment
   * @param increment - Increment amount (float)
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) {
    parser.push('HINCRBYFLOAT');
    parser.pushKey(key);
    parser.push(field, increment.toString());
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
