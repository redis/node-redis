import { RedisArgument, NullReply, TuplesReply, BlobStringReply, DoubleReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments, transformDoubleReply } from './generic-transformers';

export function transformBZPopArguments(
  command: RedisArgument,
  key: RedisVariadicArgument,
  timeout: number
) {
  const args = pushVariadicArguments([command], key);
  args.push(timeout.toString());
  return args;
}

export type BZPopArguments = typeof transformBZPopArguments extends (_: any, ...args: infer T) => any ? T : never;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(...args: BZPopArguments) {
    return transformBZPopArguments('BZPOPMAX', ...args);
  },
  transformReply: {
    2(
      reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply, BlobStringReply]>>,
      preserve?: any,
      typeMapping?: TypeMapping
    ) {
      return reply === null ? null : {
        key: reply[0],
        value: reply[1],
        score: transformDoubleReply[2](reply[2], preserve, typeMapping)
      };
    },
    3(reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply, DoubleReply]>>) {
      return reply === null ? null : {
        key: reply[0],
        value: reply[1],
        score: reply[2]
      };
    }
  }
} as const satisfies Command;

