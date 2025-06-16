import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Inserts one or more values into an array at the specified index.
   * Returns the new array length after insert, or null if the path does not exist.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param index - The position where to insert the values
   * @param json - The first value to insert
   * @param jsons - Additional values to insert
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    path: RedisArgument,
    index: number,
    json: RedisJSON,
    ...jsons: Array<RedisJSON>
  ) {
    parser.push('JSON.ARRINSERT');
    parser.pushKey(key);
    parser.push(path, index.toString(), transformRedisJsonArgument(json));

    for (let i = 0; i < jsons.length; i++) {
      parser.push(transformRedisJsonArgument(jsons[i]));
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
