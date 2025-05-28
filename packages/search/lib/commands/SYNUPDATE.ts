import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export interface FtSynUpdateOptions {
  SKIPINITIALSCAN?: boolean;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Updates a synonym group with new terms.
   * @param parser - The command parser
   * @param index - Name of the index that contains the synonym group
   * @param groupId - ID of the synonym group to update
   * @param terms - One or more synonym terms to add to the group
   * @param options - Optional parameters:
   *   - SKIPINITIALSCAN: Skip the initial scan for existing documents
   */
  parseCommand(
    parser: CommandParser,
    index: RedisArgument,
    groupId: RedisArgument,
    terms: RedisVariadicArgument,
    options?: FtSynUpdateOptions
  ) {
    parser.push('FT.SYNUPDATE', index, groupId);

    if (options?.SKIPINITIALSCAN) {
      parser.push('SKIPINITIALSCAN');
    }

    parser.pushVariadic(terms);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
