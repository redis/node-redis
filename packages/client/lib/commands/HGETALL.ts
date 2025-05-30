import { CommandParser } from '../client/parser';
import { RedisArgument, MapReply, BlobStringReply, Command } from '../RESP/types';
import { transformTuplesReply } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Gets all fields and values in a hash
   * @param parser - The Redis command parser
   * @param key - Key of the hash
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('HGETALL');
    parser.pushKey(key);
  },
  TRANSFORM_LEGACY_REPLY: true,
  transformReply: {
    2: transformTuplesReply<BlobStringReply>,
    3: undefined as unknown as () => MapReply<BlobStringReply, BlobStringReply>
  }
} as const satisfies Command;
