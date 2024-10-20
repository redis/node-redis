import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export interface JsonMSetItem {
  key: RedisArgument;
  path: RedisArgument;
  value: RedisJSON;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, items: Array<JsonMSetItem>) {
    parser.push('JSON.MSET');

    for (let i = 0; i < items.length; i++) {
      parser.pushKey(items[i].key);
      parser.push(items[i].path, transformRedisJsonArgument(items[i].value));
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
