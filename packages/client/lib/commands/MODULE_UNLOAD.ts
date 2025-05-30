import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the MODULE UNLOAD command
   * 
   * @param parser - The command parser
   * @param name - The name of the module to unload
   * @see https://redis.io/commands/module-unload/
   */
  parseCommand(parser: CommandParser, name: RedisArgument) {
    parser.push('MODULE', 'UNLOAD', name);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
