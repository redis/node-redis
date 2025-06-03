import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Adds an alias to a RediSearch index.
   * @param parser - The command parser
   * @param alias - The alias to add
   * @param index - The index name to alias
   */
  parseCommand(parser: CommandParser, alias: RedisArgument, index: RedisArgument) {
    parser.push('FT.ALIASADD', alias, index);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
