import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument, id: RedisVariadicArgument) {
    parser.push('XACK');
    parser.pushKey(key);
    parser.push(group)
    parser.pushVariadic(id);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
 