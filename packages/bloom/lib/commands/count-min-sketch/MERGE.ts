import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';

interface BfMergeSketch {
  name: RedisArgument;
  weight: number;
}

export type BfMergeSketches = Array<RedisArgument> | Array<BfMergeSketch>;

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    source: BfMergeSketches
  ) {
    parser.push('CMS.MERGE');
    parser.pushKey(destination);
    parser.push(source.length.toString());

    if (isPlainSketches(source)) {
      parser.pushVariadic(source);
    } else {
      for (let i = 0; i < source.length; i++) {
        parser.push(source[i].name);
      }
      parser.push('WEIGHTS');
      for (let i = 0; i < source.length; i++) {
        parser.push(source[i].weight.toString())
      }
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

function isPlainSketches(src: BfMergeSketches): src is Array<RedisArgument> {
  return typeof src[0] === 'string' || src[0] instanceof Buffer;
}
