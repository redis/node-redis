import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument | Array<RedisArgument>,
    timeout: number
  ) {
    const args = pushVariadicArguments(['BRPOP'], key);
    args.push(timeout.toString());
    return args;
  },
  transformReply(reply: NullReply | [BlobStringReply, BlobStringReply]) {
    if (reply === null) return null;

    return {
      key: reply[0],
      element: reply[1]
    };
  }
} as const satisfies Command;
