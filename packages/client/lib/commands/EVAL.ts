import { RedisArgument, ReplyUnion, Command } from '../RESP/types';

export interface EvalOptions {
  keys?: Array<RedisArgument>;
  arguments?: Array<RedisArgument>;
}

export function transformEvalArguments(
  command: RedisArgument,
  script: RedisArgument,
  options?: EvalOptions
) {
  const args = [command, script];

  if (options?.keys) {
    args.push(options.keys.length.toString(), ...options.keys);
  } else {
    args.push('0');
  }

  if (options?.arguments) {
    args.push(...options.arguments);
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: (_, options?: EvalOptions) => options?.keys?.[0],
  IS_READ_ONLY: false,
  transformArguments: transformEvalArguments.bind(undefined, 'EVAL'),
  transformReply: undefined as unknown as () => ReplyUnion
} as const satisfies Command;
