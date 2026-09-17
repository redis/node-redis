import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import type { CmsInitOptions } from './INITBYDIM';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, error: number, probability: number, options?: CmsInitOptions) {
    parser.push('CMS.INITBYPROB');
    parser.pushKey(key);
    parser.push(error.toString(), probability.toString());

    if (options?.CELL_SIZE) {
      parser.push('CELL_SIZE', options.CELL_SIZE.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
