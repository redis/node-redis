import { Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments, transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export interface CfInsertOptions {
  CAPACITY?: number;
  NOCREATE?: boolean;
}

export function transofrmCfInsertArguments(
  command: RedisArgument,
  key: RedisArgument,
  items: RedisVariadicArgument,
  options?: CfInsertOptions
) {
  const args = [command, key];

  if (options?.CAPACITY !== undefined) {
    args.push('CAPACITY', options.CAPACITY.toString());
  }

  if (options?.NOCREATE) {
    args.push('NOCREATE');
  }

  args.push('ITEMS');
  return pushVariadicArguments(args, items);
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments: transofrmCfInsertArguments.bind(undefined, 'CF.INSERT'),
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
