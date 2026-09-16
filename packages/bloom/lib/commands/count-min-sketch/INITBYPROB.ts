import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import type { CmsCellSize } from './INITBYDIM';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, error: number, probability: number, cellSize?: CmsCellSize) {
    parser.push('CMS.INITBYPROB');
    parser.pushKey(key);
    parser.push(error.toString(), probability.toString());

    if (cellSize !== undefined) {
      parser.push('CELL_SIZE', cellSize.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
