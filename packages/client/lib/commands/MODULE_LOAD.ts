import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, path: RedisArgument, moduleArguments?: Array<RedisArgument>) {
    parser.pushVariadic(['MODULE', 'LOAD', path]);

    if (moduleArguments) {
      parser.pushVariadic(moduleArguments);
    }
  },
  transformArguments(path: RedisArgument, moduleArguments?: Array<RedisArgument>) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
