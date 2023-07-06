import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

interface BfMergeSketch {
  name: RedisArgument;
  weight: number;
}

export type BfMergeSketches = Array<RedisArgument> | Array<BfMergeSketch>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    destination: RedisArgument,
    source: BfMergeSketches
  ) {
    let args = ['CMS.MERGE', destination, source.length.toString()];

    if (isPlainSketches(source)) {
      args = args.concat(source);
    } else {
      const { length } = args;
      args[length + source.length] = 'WEIGHTS';
      for (let i = 0; i < source.length; i++) {
        args[length + i] = source[i].name;
        args[length + source.length + i + 1] = source[i].weight.toString();
      }
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

function isPlainSketches(src: BfMergeSketches): src is Array<RedisArgument> {
  return typeof src[0] === 'string' || src[0] instanceof Buffer;
}
