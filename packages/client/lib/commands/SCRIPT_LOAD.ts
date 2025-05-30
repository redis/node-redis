import { CommandParser } from '../client/parser';
import { BlobStringReply, Command, RedisArgument } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SCRIPT LOAD command
   * 
   * @param parser - The command parser
   * @param script - The Lua script to load
   * @see https://redis.io/commands/script-load/
   */
  parseCommand(parser: CommandParser, script: RedisArgument) {
    parser.push('SCRIPT', 'LOAD', script);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
