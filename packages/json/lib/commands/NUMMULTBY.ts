import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import NUMINCRBY from './NUMINCRBY';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, by: number) {
    parser.push('JSON.NUMMULTBY');
    parser.pushKey(key);
    parser.push(path, by.toString());
  },
  transformReply: NUMINCRBY.transformReply
} as const satisfies Command;
