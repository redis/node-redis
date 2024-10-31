import { CommandParser } from '@redis/client/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';

export interface FtSynUpdateOptions {
  SKIPINITIALSCAN?: boolean;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
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
