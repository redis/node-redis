import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/lib/RESP/types';

export interface FtSugAddOptions {
  INCR?: boolean;
  PAYLOAD?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, string: RedisArgument, score: number, options?: FtSugAddOptions) {
    parser.push('FT.SUGADD');
    parser.pushKey(key);
    parser.push(string, score.toString());

    if (options?.INCR) {
      parser.push('INCR');
    }

    if (options?.PAYLOAD) {
      parser.push('PAYLOAD', options.PAYLOAD);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
