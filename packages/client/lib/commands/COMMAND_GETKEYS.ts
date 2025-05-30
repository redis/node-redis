import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Extracts the key names from a Redis command
   * @param parser - The Redis command parser
   * @param args - Command arguments to analyze
   */
  parseCommand(parser: CommandParser, args: Array<RedisArgument>) {
    parser.push('COMMAND', 'GETKEYS');
    parser.push(...args);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
