import { TuplesToMapReply, BlobStringReply, ArrayReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';
import FUNCTION_LIST, { FunctionListReplyItem } from './FUNCTION_LIST';

export type FunctionListWithCodeReply = ArrayReply<TuplesToMapReply<[
  ...FunctionListReplyItem,
  [BlobStringReply<'library_code'>, BlobStringReply],
]>>;

export default {
  NOT_KEYED_COMMAND: FUNCTION_LIST.NOT_KEYED_COMMAND,
  IS_READ_ONLY: FUNCTION_LIST.IS_READ_ONLY,
  /**
   * Returns all libraries and functions including their source code
   * @param parser - The Redis command parser
   * @param options - Options for listing functions
   */
  parseCommand(...args: Parameters<typeof FUNCTION_LIST.parseCommand>) {
    FUNCTION_LIST.parseCommand(...args);
    args[0].push('WITHCODE');
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<FunctionListWithCodeReply>>) => {
      return reply.map(library => {
        const unwrapped = library as unknown as UnwrapReply<typeof library>;
        return {
          library_name: unwrapped[1],
          engine: unwrapped[3],
          functions: (unwrapped[5] as unknown as UnwrapReply<typeof unwrapped[5]>).map(fn => {
            const unwrapped = fn as unknown as UnwrapReply<typeof fn>;
            return {
              name: unwrapped[1],
              description: unwrapped[3],
              flags: unwrapped[5]
            };
          }),
          library_code: unwrapped[7]
        };
      });
    },
    3: undefined as unknown as () => FunctionListWithCodeReply
  }
} as const satisfies Command;
