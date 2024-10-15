import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export interface BfInsertOptions {
  CAPACITY?: number;
  ERROR?: number;
  EXPANSION?: number;
  NOCREATE?: boolean;
  NONSCALING?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    items: RedisVariadicArgument,
    options?: BfInsertOptions
  ) {
    const args = ['BF.INSERT', key];

    if (options?.CAPACITY !== undefined) {
      args.push('CAPACITY', options.CAPACITY.toString());
    }

    if (options?.ERROR !== undefined) {
      args.push('ERROR', options.ERROR.toString());
    }

    if (options?.EXPANSION !== undefined) {
      args.push('EXPANSION', options.EXPANSION.toString());
    }

    if (options?.NOCREATE) {
      args.push('NOCREATE');
    }

    if (options?.NONSCALING) {
      args.push('NONSCALING');
    }

    args.push('ITEMS');
    return pushVariadicArguments(args, items);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
