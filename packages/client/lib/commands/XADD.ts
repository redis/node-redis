import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface XAddOptions {
  TRIM?: {
    strategy?: 'MAXLEN' | 'MINID';
    strategyModifier?: '=' | '~';
    threshold: number;
    limit?: number;
  };
}

export function parseXAddArguments(
  optional: RedisArgument | undefined,
  parser: CommandParser,
  key: RedisArgument,
  id: RedisArgument,
  message: Record<string, RedisArgument>,
  options?: XAddOptions
) {
  parser.push('XADD');
  parser.pushKey(key);
  if (optional) {
    parser.push(optional);
  }

  if (options?.TRIM) {
    if (options.TRIM.strategy) {
      parser.push(options.TRIM.strategy);
    }

    if (options.TRIM.strategyModifier) {
      parser.push(options.TRIM.strategyModifier);
    }

    parser.push(options.TRIM.threshold.toString());

    if (options.TRIM.limit) {
      parser.pushVariadic(['LIMIT', options.TRIM.limit.toString()]);
    }
  }

  parser.push(id);

  for (const [key, value] of Object.entries(message)) {
    parser.pushVariadic([key, value]);
  }
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand: parseXAddArguments.bind(undefined, undefined),
  transformArguments(
    key: RedisArgument,
    id: RedisArgument,
    message: Record<string, RedisArgument>,
    options?: XAddOptions
  ) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
