import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export default {
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
    parser.push(path, index.toString(), transformRedisJsonArgument(json));

    for (let i = 0; i < jsons.length; i++) {
      parser.push(transformRedisJsonArgument(jsons[i]));
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
