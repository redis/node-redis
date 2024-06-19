import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.pushVariadic(['OBJECT', 'FREQ']);
    parser.push(key);
  },
  transformArguments(key: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
