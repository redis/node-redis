import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisJSON, transformRedisJsonArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Appends one or more values to the end of an array in a JSON document.
   * Returns the new array length after append, or null if the path does not exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key to append to
   * @param path - Path to the array in the JSON document
   * @param json - The first value to append
   * @param jsons - Additional values to append
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    ...jsons: Array<RedisJSON>
  ) {
    parser.push('JSON.ARRAPPEND');
    parser.pushKey(key);
    parser.push(path, transformRedisJsonArgument(json));

    for (let i = 0; i < jsons.length; i++) {
      parser.push(transformRedisJsonArgument(jsons[i]));
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
