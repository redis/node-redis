import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';
import { ListSide } from './generic-transformers';

/**
 * Ordering of the moved elements at the destination.
 *
 * - `OBO` (one-by-one): push each element as it is popped, reversing the
 *   moved block's relative order (stack semantics).
 * - `BULK`: preserve the moved block's original relative order (queue semantics).
 */
export type LMoveMOrder = 'OBO' | 'BULK';

export type LMoveMOptions = {
  /** Move up to `COUNT` elements (fewer if the source has fewer). */
  COUNT: number;
  ORDER?: LMoveMOrder;
} | {
  /** Move exactly `EXACTLY` elements; if the source has fewer, move nothing. */
  EXACTLY: number;
  ORDER?: LMoveMOrder;
};

/**
 * Pushes the trailing `[<COUNT|EXACTLY> count [OBO|BULK]]` arguments shared by
 * LMOVEM and BLMOVEM. Kept separate from the command bodies because BLMOVEM's
 * `timeout` sits between the sides and these options, so only the tail is shared.
 */
export function parseLMoveMOptions(parser: CommandParser, options?: LMoveMOptions) {
  if (options) {
    if ('EXACTLY' in options) {
      parser.push('EXACTLY', options.EXACTLY.toString());
    } else {
      parser.push('COUNT', options.COUNT.toString());
    }

    if (options.ORDER !== undefined) {
      parser.push(options.ORDER);
    }
  }
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    source: RedisArgument,
    destination: RedisArgument,
    sourceSide: ListSide,
    destinationSide: ListSide,
    options?: LMoveMOptions
  ) {
    parser.push('LMOVEM');
    parser.pushKeys([source, destination]);
    parser.push(sourceSide, destinationSide);
    parseLMoveMOptions(parser, options);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply> | NullReply
} as const satisfies Command;
