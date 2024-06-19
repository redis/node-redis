import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, name: RedisArgument) {
    parser.pushVariadic(['CLIENT', 'SETNAME', name]);
  },
  transformArguments(name: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
