import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export type CmsCellSize = 1 | 2 | 4 | 8;

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, width: number, depth: number, cellSize?: CmsCellSize) {
    parser.push('CMS.INITBYDIM');
    parser.pushKey(key);
    parser.push(width.toString(), depth.toString());

    if (cellSize !== undefined) {
      parser.push('CELL_SIZE', cellSize.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
