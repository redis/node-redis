import { UnwrapReply, NullReply, TuplesReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisVariadicArgument,
    timeout: number
  ) {
    const args = pushVariadicArguments(['BLPOP'], key);
    args.push(timeout.toString());
    return args;
  },
  transformReply(reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply]>>) {
    if (reply === null) return null;

    return {
      key: reply[0],
      element: reply[1]
    };
  }
} as const satisfies Command;
