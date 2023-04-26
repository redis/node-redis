import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export interface SortOptions {
  BY?: string;
  LIMIT?: {
    offset: number;
    count: number;
  },
  GET?: string | Array<string>;
  DIRECTION?: 'ASC' | 'DESC';
  ALPHA?: true;
}

export function transformSortArguments(
  command: RedisArgument,
  options?: SortOptions
) {
  const args = [command];

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
    if (typeof options.GET === 'string') {
      args.push('GET', options.GET);
    } else {
      for (const pattern of options.GET) {
        args.push('GET', pattern);
      }
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

