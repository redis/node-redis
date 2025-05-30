import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the MODULE LOAD command
   * 
   * @param parser - The command parser
   * @param path - Path to the module file
   * @param moduleArguments - Optional arguments to pass to the module
   * @see https://redis.io/commands/module-load/
   */
  parseCommand(parser: CommandParser, path: RedisArgument, moduleArguments?: Array<RedisArgument>) {
    parser.push('MODULE', 'LOAD', path);

    if (moduleArguments) {
      parser.push(...moduleArguments);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
