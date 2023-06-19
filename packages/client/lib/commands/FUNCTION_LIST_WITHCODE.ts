import { TuplesToMapReply, BlobStringReply, ArrayReply, Command, Resp2Reply } from '../RESP/types';
import FUNCTION_LIST, { FunctionListReplyItem } from './FUNCTION_LIST';

export type FunctionListWithCodeReply = ArrayReply<TuplesToMapReply<[
  ...FunctionListReplyItem,
  [BlobStringReply<'library_code'>, BlobStringReply],
]>>;

export default {
  FIRST_KEY_INDEX: FUNCTION_LIST.FIRST_KEY_INDEX,
  IS_READ_ONLY: FUNCTION_LIST.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof FUNCTION_LIST.transformArguments>) {
    const redisArgs = FUNCTION_LIST.transformArguments(...args);
    redisArgs.push('WITHCODE');
    return redisArgs;
  },
  transformReply: {
    2: (reply: Resp2Reply<FunctionListWithCodeReply>) => {
      return reply.map((library: any) => ({
        library_name: library[1],
        engine: library[3],
        functions: library[5].map((fn: any) => ({
          name: fn[1],
          description: fn[3],
          flags: fn[5]
        })),
        library_code: library[7]
      })) as unknown as number;
    },
    3: undefined as unknown as () => FunctionListWithCodeReply
  }
} as const satisfies Command;
