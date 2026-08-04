import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface FtDropIndexOptions {
  DD?: true;
}

export default {
  parseCommand(parser: CommandParser, index: RedisArgument, options?: FtDropIndexOptions) {
    parser.push('FT.DROPINDEX', index);

    if (options?.DD) {
      parser.push('DD');
    }
  },
  transformReply: {
    2: undefined as unknown as () => SimpleStringReply<'OK'>,
    3: undefined as unknown as () => NumberReply
  }
} as const satisfies Command;
