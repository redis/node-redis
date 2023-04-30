import { NullReply, TuplesReply, BlobStringReply, Command } from '../RESP/types';
import { transformLMPopArguments, LMPopOptions, ListSide, RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 2,
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
