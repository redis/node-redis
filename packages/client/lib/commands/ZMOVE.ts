import { CommandParser } from '../client/parser';
import { RedisArgument, NullReply, TuplesReply, BlobStringReply, DoubleReply, ArrayReply, UnwrapReply, Resp2Reply, Command, TypeMapping } from '../RESP/types';
import { SortedSetSide, transformDoubleReply, transformStringDoubleArgument } from './generic-transformers';

/**
 * Score range for `ZMOVE ... BYSCORE`. Bounds follow ZRANGEBYSCORE syntax (`(` for exclusive, `-inf`, `+inf`)
 */
export interface ZMoveScoreRange {
  min: RedisArgument | number;
  max: RedisArgument | number;
}

export type ZMoveSelection = SortedSetSide | ZMoveScoreRange;

export interface ZMoveOptions {
  COUNT?: number;
}

export type ZMoveRawReply = NullReply | ArrayReply<TuplesReply<[
  value: BlobStringReply,
  score: DoubleReply
]>>;

export default {
  parseCommand(
    parser: CommandParser,
    source: RedisArgument,
    destination: RedisArgument,
    selection: ZMoveSelection,
    options?: ZMoveOptions
  ) {
    parser.push('ZMOVE');
    parser.pushKey(source);
    parser.pushKey(destination);

    if (typeof selection === 'string') {
      parser.push(selection);
    } else {
      parser.push(
        'BYSCORE',
        transformStringDoubleArgument(selection.min),
        transformStringDoubleArgument(selection.max)
      );
    }

    if (options?.COUNT !== undefined) {
      parser.push('COUNT', options.COUNT.toString());
    }
  },
  transformReply: {
    2(reply: UnwrapReply<Resp2Reply<ZMoveRawReply>>, preserve?: unknown, typeMapping?: TypeMapping) {
      return reply === null ? null : reply.map(member => {
        const [value, score] = member as unknown as UnwrapReply<typeof member>;
        return {
          value,
          score: transformDoubleReply[2](score, preserve, typeMapping)
        };
      });
    },
    3(reply: UnwrapReply<ZMoveRawReply>) {
      return reply === null ? null : reply.map(member => {
        const [value, score] = member as unknown as UnwrapReply<typeof member>;
        return {
          value,
          score
        };
      });
    }
  }
} as const satisfies Command;
