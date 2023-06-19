import { RedisArgument, TuplesToMapReply, BlobStringReply, ArrayReply, NullReply, SetReply, Resp2Reply, CommandArguments, Command } from '../RESP/types';

export interface FunctionListOptions {
  LIBRARYNAME?: RedisArgument;
}

export type FunctionListReplyItem = [
  [BlobStringReply<'library_name'>, BlobStringReply],
  [BlobStringReply<'engine'>, BlobStringReply],
  [BlobStringReply<'functions'>, ArrayReply<TuplesToMapReply<[
    [BlobStringReply<'name'>, BlobStringReply],
    [BlobStringReply<'description'>, BlobStringReply | NullReply],
    [BlobStringReply<'flags'>, SetReply<BlobStringReply>],
  ]>>]
]

export type FunctionListReply = ArrayReply<TuplesToMapReply<FunctionListReplyItem>>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(options?: FunctionListOptions) {
    const args: CommandArguments = ['FUNCTION', 'LIST'];

    if (options?.LIBRARYNAME) {
      args.push('LIBRARYNAME', options.LIBRARYNAME);
    }

    return args;
  },
  transformReply: {
    2: (reply: Resp2Reply<FunctionListReply>) => {
      return reply.map(library => ({
        library_name: library[1],
        engine: library[3],
        functions: library[5].map(fn => ({
          name: fn[1],
          description: fn[3],
          flags: fn[5]
        }))
      }));
    },
    3: undefined as unknown as () => FunctionListReply
  }
} as const satisfies Command;
