import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { transformBooleanArrayReply } from '@redis/client/lib/commands/generic-transformers';

export interface BfInsertOptions {
  CAPACITY?: number;
  ERROR?: number;
  EXPANSION?: number;
  NOCREATE?: boolean;
  NONSCALING?: boolean;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    items: RedisVariadicArgument,
    options?: BfInsertOptions
  ) {
    parser.push('BF.INSERT');
    parser.pushKey(key);

    if (options?.CAPACITY !== undefined) {
      parser.push('CAPACITY', options.CAPACITY.toString());
    }

    if (options?.ERROR !== undefined) {
      parser.push('ERROR', options.ERROR.toString());
    }

    if (options?.EXPANSION !== undefined) {
      parser.push('EXPANSION', options.EXPANSION.toString());
    }

    if (options?.NOCREATE) {
      parser.push('NOCREATE');
    }

    if (options?.NONSCALING) {
      parser.push('NONSCALING');
    }

    parser.push('ITEMS');
    parser.pushVariadic(items);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
