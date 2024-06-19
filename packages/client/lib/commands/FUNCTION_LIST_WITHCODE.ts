import { TuplesToMapReply, BlobStringReply, ArrayReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import FUNCTION_LIST, { FunctionListReplyItem } from './FUNCTION_LIST';

export type FunctionListWithCodeReply = ArrayReply<TuplesToMapReply<[
  ...FunctionListReplyItem,
  [BlobStringReply<'library_code'>, BlobStringReply],
]>>;

export default {
  FIRST_KEY_INDEX: FUNCTION_LIST.FIRST_KEY_INDEX,
  IS_READ_ONLY: FUNCTION_LIST.IS_READ_ONLY,
  parseCommand(parser: CommandParser, ...args: Parameters<typeof FUNCTION_LIST.transformArguments>) {
    FUNCTION_LIST.parseCommand(parser, ...args);
    parser.push('WITHCODE');
  },
  transformArguments(...args: Parameters<typeof FUNCTION_LIST.transformArguments>) { return [] },
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
