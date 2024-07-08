import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, ms: number, value: RedisArgument) {
    parser.push('PSETEX');
    parser.pushKey(key);
    parser.pushVariadic([ms.toString(), value]);
  },
  transformArguments(key: RedisArgument, ms: number, value: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
