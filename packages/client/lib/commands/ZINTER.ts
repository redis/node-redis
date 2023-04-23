import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { transformNumberInfinityArgument } from './generic-transformers';

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
  keys: ZInterKeys<RedisArgument> | ZInterKeys<ZInterKeyAndWeight>,
  options?: ZInterOptions
) {
  if (Array.isArray(keys)) {
    args.push(keys.length.toString());

    if (keys.length) {
      if (isPlainKeys(keys)) {
        args = args.concat(keys);
      } else {
        const start = args.length;
        args[start + keys.length] = 'WEIGHTS';
        for (let i = 0; i < keys.length; i++) {
          const index = start + i;
          args[index] = keys[i].key;
          args[index + 1 + keys.length] = transformNumberInfinityArgument(keys[i].weight);
        }
      }
    }
  } else {
    args.push('1');

    if (isPlainKey(keys)) {
      args.push(keys);
    } else {
      args.push(
        keys.key,
        'WEIGHTS',
        transformNumberInfinityArgument(keys.weight)
      );
    }
  }

  if (options?.AGGREGATE) {
    args.push('AGGREGATE', options.AGGREGATE);
  }

  return args;
}

function isPlainKey(key: RedisArgument | ZInterKeyAndWeight): key is RedisArgument {
  return typeof key === 'string' || Buffer.isBuffer(key);
}

function isPlainKeys(keys: Array<RedisArgument> | Array<ZInterKeyAndWeight>): keys is Array<RedisArgument> {
  return isPlainKey(keys[0]);
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
