import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

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

export function parseSortArguments(
  command: RedisArgument,
  parser: CommandParser,
  key: RedisArgument,
  options?: SortOptions
) {
  parser.push(command);
  parser.pushKey(key);

  if (options?.BY) {
    parser.pushVariadic(['BY', options.BY]);
  }

  if (options?.LIMIT) {
    parser.pushVariadic(
      [
        'LIMIT',
        options.LIMIT.offset.toString(),
        options.LIMIT.count.toString()
      ]
    );
  }

  if (options?.GET) {
    if (Array.isArray(options.GET)) {
      for (const pattern of options.GET) {
        parser.pushVariadic(['GET', pattern]);
      }
    } else {
      parser.pushVariadic(['GET', options.GET]);
    }
  }

  if (options?.DIRECTION) {
    parser.push(options.DIRECTION);
  }

  if (options?.ALPHA) {
    parser.push('ALPHA');
  }
}

export function transformSortArguments(
  command: RedisArgument,
  key: RedisArgument,
  options?: SortOptions
) { return [] }

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand: parseSortArguments.bind(undefined, 'SORT'),
  transformArguments: transformSortArguments.bind(undefined, 'SORT'),
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
