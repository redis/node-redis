import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, path: RedisArgument, moduleArguments?: Array<RedisArgument>) {
    parser.push('MODULE', 'LOAD', path);

    if (moduleArguments) {
      parser.push(...moduleArguments);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
