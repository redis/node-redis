import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface CmsInitOptions {
  /**
   * The size, in bytes, of each counter in the sketch.
   * @since 8.12
   */
  CELL_SIZE?: 1 | 2 | 4 | 8;
}

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, width: number, depth: number, options?: CmsInitOptions) {
    parser.push('CMS.INITBYDIM');
    parser.pushKey(key);
    parser.push(width.toString(), depth.toString());

    if (options?.CELL_SIZE) {
      parser.push('CELL_SIZE', options.CELL_SIZE.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
