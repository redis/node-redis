import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export interface TopKReserveOptions {
  width: number;
  depth: number;
  decay: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, topK: number, options?: TopKReserveOptions) {
    const args = ['TOPK.RESERVE', key, topK.toString()];

    if (options) {
      args.push(
        options.width.toString(),
        options.depth.toString(),
        options.decay.toString()
      );
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
