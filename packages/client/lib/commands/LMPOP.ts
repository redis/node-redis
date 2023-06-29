import { CommandArguments, NullReply, TuplesReply, BlobStringReply, Command } from '../RESP/types';
import { ListSide, RedisVariadicArgument, pushVariadicArgument } from './generic-transformers';

export interface LMPopOptions {
  COUNT?: number;
}

export function transformLMPopArguments(
  args: CommandArguments,
  keys: RedisVariadicArgument,
  side: ListSide,
  options?: LMPopOptions
): CommandArguments {
  args = pushVariadicArgument(args, keys);

  args.push(side);

  if (options?.COUNT !== undefined) {
    args.push('COUNT', options.COUNT.toString());
  }

  return args;
}

export type LMPopArguments = typeof transformLMPopArguments extends (_: any, ...args: infer T) => any ? T : never;

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(...args: LMPopArguments) {
    return transformLMPopArguments(['LMPOP'], ...args);
  },
  transformReply: undefined as unknown as () => NullReply | TuplesReply<[
    key: BlobStringReply,
    elements: Array<BlobStringReply>
  ]>
} as const satisfies Command;
