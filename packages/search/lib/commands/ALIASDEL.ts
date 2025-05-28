import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Removes an existing alias from a RediSearch index.
   * @param parser - The command parser
   * @param alias - The alias to remove
   */
  parseCommand(parser: CommandParser, alias: RedisArgument) {
    parser.push('FT.ALIASDEL', alias);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
