import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { ZKeys, pushZKeysArguments } from './generic-transformers';

export type ZInterKeyAndWeight = {
  key: RedisArgument;
  weight: number;
};

export type ZInterKeys<T> = T | [T, ...Array<T>];

export interface ZInterOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export function pushZInterArguments(
  args: Array<RedisArgument>,
  keys: ZKeys,
  options?: ZInterOptions
) {
  args = pushZKeysArguments(args, keys);

  if (options?.AGGREGATE) {
    args.push('AGGREGATE', options.AGGREGATE);
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(
    keys: ZInterKeys<RedisArgument> | ZInterKeys<ZInterKeyAndWeight>,
    options?: ZInterOptions
  ) {
    return pushZInterArguments(['ZINTER'], keys, options);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
