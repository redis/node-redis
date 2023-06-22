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
  pushVariadicArgument(args, keys);

  args.push(side);

  if (options?.COUNT) {
    args.push('COUNT', options.COUNT.toString());
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  transformArguments(
    keys: RedisVariadicArgument,
    side: ListSide,
    options?: LMPopOptions
  ) {
    return transformLMPopArguments(
      ['LMPOP'],
      keys,
      side,
      options
    );
  },
  transformReply: undefined as unknown as () => NullReply | TuplesReply<[
    key: BlobStringReply,
    elements: Array<BlobStringReply>
  ]>
} as const satisfies Command;
