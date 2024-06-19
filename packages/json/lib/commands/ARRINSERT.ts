import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
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
    parser.pushVariadic([path, index.toString(), transformRedisJsonArgument(json)]);

    for (let i = 0; i < jsons.length; i++) {
      parser.push(transformRedisJsonArgument(jsons[i]));
    }
  },
  transformArguments(key: RedisArgument, path: RedisArgument, index: number, json: RedisJSON,...jsons: Array<RedisJSON>) {return [] },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
