import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    start: number,
    stop: number
  ) {      
    parser.push('ZREMRANGEBYRANK');
    parser.pushKey(key);
    parser.pushVariadic([start.toString(), stop.toString()]);
  },
  transformArguments(key: RedisArgument, start: number, stop: number) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
