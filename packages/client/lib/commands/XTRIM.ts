import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface XTrimOptions {
  strategyModifier?: '=' | '~';
  /** added in 6.2 */
  LIMIT?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    strategy: 'MAXLEN' | 'MINID',
    threshold: number,
    options?: XTrimOptions
  ) {
    parser.push('XTRIM')
    parser.pushKey(key);
    parser.push(strategy);

    if (options?.strategyModifier) {
      parser.push(options.strategyModifier);
    }

    parser.push(threshold.toString());

    if (options?.LIMIT) {
      parser.pushVariadic(['LIMIT', options.LIMIT.toString()]);
    }
  },
  transformArguments(key: RedisArgument, strategy: 'MAXLEN' | 'MINID', threshold: number, options?: XTrimOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
