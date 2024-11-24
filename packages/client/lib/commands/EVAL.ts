import { CommandParser } from '../client/parser';
import { RedisArgument, ReplyUnion, Command } from '../RESP/types';

export interface EvalOptions {
  keys?: Array<RedisArgument>;
  arguments?: Array<RedisArgument>;
}

export function parseEvalArguments(
  parser: CommandParser,
  script: RedisArgument,
  options?: EvalOptions
) {
  parser.push(script);
  if (options?.keys) {
    parser.pushKeysLength(options.keys);
  } else {
    parser.push('0');
  }

  if (options?.arguments) {
    parser.push(...options.arguments)
  }
}

export default {
  IS_READ_ONLY: false,
  parseCommand(...args: Parameters<typeof parseEvalArguments>) {
    args[0].push('EVAL');
    parseEvalArguments(...args);
  },
  transformReply: undefined as unknown as () => ReplyUnion
} as const satisfies Command;
