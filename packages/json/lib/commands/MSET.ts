import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export interface JsonMSetItem {
  key: RedisArgument;
  path: RedisArgument;
  value: RedisJSON;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, items: Array<JsonMSetItem>) {
    parser.push('JSON.MSET');

    for (let i = 0; i < items.length; i++) {
      parser.pushKey(items[i].key);
      parser.pushVariadic([items[i].path, transformRedisJsonArgument(items[i].value)]);
    }
  },
  transformArguments(items: Array<JsonMSetItem>) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
