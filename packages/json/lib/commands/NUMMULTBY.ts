import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import NUMINCRBY from './NUMINCRBY';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, by: number) {
    parser.push('JSON.NUMMULTBY');
    parser.pushKey(key);
    parser.pushVariadic([path, by.toString()]);
  },
  transformArguments(key: RedisArgument, path: RedisArgument, by: number) { return [] },
  transformReply: NUMINCRBY.transformReply
} as const satisfies Command;
