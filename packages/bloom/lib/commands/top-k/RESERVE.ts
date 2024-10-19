import { CommandParser } from '@redis/client/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/lib/RESP/types';

export interface TopKReserveOptions {
  width: number;
  depth: number;
  decay: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, topK: number, options?: TopKReserveOptions) {
    parser.push('TOPK.RESERVE');
    parser.pushKey(key);
    parser.push(topK.toString());

    if (options) {
      parser.push(
        options.width.toString(),
        options.depth.toString(),
        options.decay.toString()
      );
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
