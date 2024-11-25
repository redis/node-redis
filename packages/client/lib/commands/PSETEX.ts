import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, ms: number, value: RedisArgument) {
    parser.push('PSETEX');
    parser.pushKey(key);
    parser.push(ms.toString(), value);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
