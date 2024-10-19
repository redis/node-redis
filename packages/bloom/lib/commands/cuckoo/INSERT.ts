import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, RedisArgument } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument, transformBooleanArrayReply } from '@redis/client/lib/commands/generic-transformers';

export interface CfInsertOptions {
  CAPACITY?: number;
  NOCREATE?: boolean;
}

export function parseCfInsertArguments(
  parser: CommandParser, 
  key: RedisArgument,
  items: RedisVariadicArgument,
  options?: CfInsertOptions
) {
  parser.pushKey(key);

  if (options?.CAPACITY !== undefined) {
    parser.push('CAPACITY', options.CAPACITY.toString());
  }

  if (options?.NOCREATE) {
    parser.push('NOCREATE');
  }

  parser.push('ITEMS');
  parser.pushVariadic(items);
}

export default {
  IS_READ_ONLY: false,
  parseCommand(...args: Parameters<typeof parseCfInsertArguments>) {
    args[0].push('CF.INSERT');
    parseCfInsertArguments(...args);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
