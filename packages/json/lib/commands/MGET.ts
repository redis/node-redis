import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, UnwrapReply, ArrayReply, NullReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { transformRedisJsonNullReply, JsonReviver } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Gets values at a specific path from multiple JSON documents.
   * Returns an array of values at the path from each key, null for missing keys/paths.
   * 
   * @param parser - The Redis command parser
   * @param keys - Array of keys containing JSON documents
   * @param path - Path to retrieve from each document
   * @param reviver - An optional reviver function to call when parsing the reply from Redis
   */
  parseCommand(parser: CommandParser, keys: Array<RedisArgument>, path: RedisArgument, reviver?: JsonReviver) {
    parser.push('JSON.MGET');
    parser.pushKeys(keys);
    parser.push(path);
    parser.preserve = reviver;
  },
  transformReply(reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>, reviver?: JsonReviver) {
    return reply.map(json => transformRedisJsonNullReply(json, reviver))
  }
} as const satisfies Command;
