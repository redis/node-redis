import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, UnwrapReply, ArrayReply, NullReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { transformRedisJsonNullReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Gets values at a specific path from multiple JSON documents.
   * Returns an array of values at the path from each key, null for missing keys/paths.
   * 
   * @param parser - The Redis command parser
   * @param keys - Array of keys containing JSON documents
   * @param path - Path to retrieve from each document
   */
  parseCommand(parser: CommandParser, keys: Array<RedisArgument>, path: RedisArgument) {
    parser.push('JSON.MGET');
    parser.pushKeys(keys);
    parser.push(path);
  },
  transformReply(reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>) {
    return reply.map(json => transformRedisJsonNullReply(json))
  }
} as const satisfies Command;
