import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Gets the values of all the specified fields in a hash.
   * @param parser - The Redis command parser.
   * @param key - Key of the hash.
   * @param fields - Fields to get from the hash.
   */
  parseCommand(parser: CommandParser, key: RedisArgument, fields: RedisVariadicArgument) {
    parser.push('HMGET');
    parser.pushKey(key);
    parser.pushVariadic(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply | NullReply>
} as const satisfies Command;
