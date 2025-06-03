import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

interface BfMergeSketch {
  name: RedisArgument;
  weight: number;
}

export type BfMergeSketches = Array<RedisArgument> | Array<BfMergeSketch>;

export default {
  IS_READ_ONLY: false,
  /**
   * Merges multiple Count-Min Sketches into a single sketch, with optional weights
   * @param parser - The command parser
   * @param destination - The name of the destination sketch
   * @param source - Array of sketch names or array of sketches with weights
   */
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
