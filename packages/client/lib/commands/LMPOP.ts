import { NullReply, TuplesReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { ListSide, RedisVariadicArgument } from './generic-transformers';

export interface LMPopOptions {
  COUNT?: number;
}

export function parseLMPopArguments(
  parser: CommandParser,
  keys: RedisVariadicArgument,
  side: ListSide,
  options?: LMPopOptions
) {
  parser.pushKeysLength(keys);
  parser.push(side);

  if (options?.COUNT !== undefined) {
    parser.pushVariadic(['COUNT', options.COUNT.toString()]);
  }
}

function transformArguments(keys: RedisVariadicArgument, side: ListSide, options?: LMPopOptions) { return [] }

export type LMPopArguments = Parameters<typeof transformArguments>;

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    keys: RedisVariadicArgument,
    side: ListSide,
    options?: LMPopOptions
  ) {
    parser.push('LMPOP');
    parseLMPopArguments(parser, keys, side, options);
  },
  transformArguments: transformArguments,
  transformReply: undefined as unknown as () => NullReply | TuplesReply<[
    key: BlobStringReply,
    elements: Array<BlobStringReply>
  ]>
} as const satisfies Command;
