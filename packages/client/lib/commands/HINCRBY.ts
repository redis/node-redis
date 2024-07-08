import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) {
    parser.push('HINCRBY');
    parser.pushKey(key);
    parser.pushVariadic([field, increment.toString()]);
  },
  transformArguments(
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
