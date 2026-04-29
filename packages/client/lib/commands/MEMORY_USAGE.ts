import { CommandParser } from '../client/parser';
import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';

export interface MemoryUsageOptions {
  SAMPLES?: number;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: MemoryUsageOptions) {
    parser.push('MEMORY', 'USAGE');
    parser.pushKey(key);

    if (options?.SAMPLES) {
      parser.push('SAMPLES', options.SAMPLES.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
