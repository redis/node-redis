import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Gets the value of a field in a hash
   * @param parser - The Redis command parser
   * @param key - Key of the hash
   * @param field - Field to get the value of
   */
  parseCommand(parser: CommandParser, key: RedisArgument, field: RedisArgument) {
    parser.push('HGET');
    parser.pushKey(key);
    parser.push(field);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
