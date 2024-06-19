import { RedisArgument, ReplyUnion, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface EvalOptions {
  keys?: Array<RedisArgument>;
  arguments?: Array<RedisArgument>;
}

export function parseEvalArguments(
  command: RedisArgument,
  parser: CommandParser,
  script: RedisArgument,
  options?: EvalOptions
) {
  parser.pushVariadic([command, script]);
  if (options?.keys) {
    parser.pushKeysLength(options.keys);
  } else {
    parser.push('0');
  }

  if (options?.arguments) {
    parser.pushVariadic(options.arguments)
  }
}

export function transformEvalArguments(
  command: RedisArgument,
  script: RedisArgument,
  options?: EvalOptions
) { return [] }

export default {
  FIRST_KEY_INDEX: (_, options?: EvalOptions) => options?.keys?.[0],
  IS_READ_ONLY: false,
  parseCommand: parseEvalArguments.bind(undefined, 'EVAL'),
  transformArguments: transformEvalArguments.bind(undefined, 'EVAL'),
  transformReply: undefined as unknown as () => ReplyUnion
} as const satisfies Command;
