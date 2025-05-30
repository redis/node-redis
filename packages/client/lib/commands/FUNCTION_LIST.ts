import { CommandParser } from '../client/parser';
import { RedisArgument, TuplesToMapReply, BlobStringReply, ArrayReply, NullReply, SetReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

export interface FunctionListOptions {
  LIBRARYNAME?: RedisArgument;
}

export type FunctionListReplyItem = [
  [BlobStringReply<'library_name'>, BlobStringReply | NullReply],
  [BlobStringReply<'engine'>, BlobStringReply],
  [BlobStringReply<'functions'>, ArrayReply<TuplesToMapReply<[
    [BlobStringReply<'name'>, BlobStringReply],
    [BlobStringReply<'description'>, BlobStringReply | NullReply],
    [BlobStringReply<'flags'>, SetReply<BlobStringReply>],
  ]>>]
];

export type FunctionListReply = ArrayReply<TuplesToMapReply<FunctionListReplyItem>>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Returns all libraries and functions
   * @param parser - The Redis command parser
   * @param options - Options for listing functions
   */
  parseCommand(parser: CommandParser, options?: FunctionListOptions) {
    parser.push('FUNCTION', 'LIST');

    if (options?.LIBRARYNAME) {
      parser.push('LIBRARYNAME', options.LIBRARYNAME);
    }
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<FunctionListReply>>) => {
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
          })
        };
      });
    },
    3: undefined as unknown as () => FunctionListReply
  }
} as const satisfies Command;
