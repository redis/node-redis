import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export interface SortOptions {
  BY?: RedisArgument;
  LIMIT?: {
    offset: number;
    count: number;
  };
  GET?: RedisArgument | Array<RedisArgument>;
  DIRECTION?: 'ASC' | 'DESC';
  ALPHA?: boolean;
}

export function transformSortArguments(
  command: RedisArgument,
  key: RedisArgument,
  options?: SortOptions
) {
  const args: Array<RedisArgument> = [command, key];

  if (options?.BY) {
    args.push('BY', options.BY);
  }

  if (options?.LIMIT) {
    args.push(
      'LIMIT',
      options.LIMIT.offset.toString(),
      options.LIMIT.count.toString()
    );
  }

  if (options?.GET) {
    if (Array.isArray(options.GET)) {
      for (const pattern of options.GET) {
        args.push('GET', pattern);
      }
    } else {
      args.push('GET', options.GET);
    }
  }

  if (options?.DIRECTION) {
    args.push(options.DIRECTION);
  }

  if (options?.ALPHA) {
    args.push('ALPHA');
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments: transformSortArguments.bind(undefined, 'SORT'),
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
