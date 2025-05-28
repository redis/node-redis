import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Updates the index pointed to by an existing alias.
   * @param parser - The command parser
   * @param alias - The existing alias to update
   * @param index - The new index name that the alias should point to
   */
  parseCommand(parser: CommandParser, alias: RedisArgument, index: RedisArgument) {
    parser.push('FT.ALIASUPDATE', alias, index);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
