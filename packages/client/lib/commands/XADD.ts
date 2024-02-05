import { RedisArgument, BlobStringReply, Command, CommandArguments } from '../RESP/types';

export interface XAddOptions {
  TRIM?: {
    strategy?: 'MAXLEN' | 'MINID';
    strategyModifier?: '=' | '~';
    threshold: number;
    limit?: number;
  };
}

export function pushXAddArguments(
  args: CommandArguments,
  id: RedisArgument,
  message: Record<string, RedisArgument>,
  options?: XAddOptions
) {
  if (options?.TRIM) {
    if (options.TRIM.strategy) {
      args.push(options.TRIM.strategy);
    }

    if (options.TRIM.strategyModifier) {
      args.push(options.TRIM.strategyModifier);
    }

    args.push(options.TRIM.threshold.toString());

    if (options.TRIM.limit) {
      args.push('LIMIT', options.TRIM.limit.toString());
    }
  }

  args.push(id);

  for (const [key, value] of Object.entries(message)) {
    args.push(key, value);
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    id: RedisArgument,
    message: Record<string, RedisArgument>,
    options?: XAddOptions
  ) {
    return pushXAddArguments(['XADD', key], id, message, options);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
