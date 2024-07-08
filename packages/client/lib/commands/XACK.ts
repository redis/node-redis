import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument, id: RedisVariadicArgument) {
    parser.push('XACK');
    parser.pushKey(key);
    parser.push(group)
    parser.pushVariadic(id);
  },
  transformArguments(key: RedisArgument, group: RedisArgument, id: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
 