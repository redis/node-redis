import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface MemoryUsageOptions {
  SAMPLES?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: MemoryUsageOptions) {
    parser.pushVariadic(['MEMORY', 'USAGE']);
    parser.pushKey(key);

    if (options?.SAMPLES) {
      parser.pushVariadic(['SAMPLES', options.SAMPLES.toString()]);
    }
  },
  transformArguments(key: RedisArgument, options?: MemoryUsageOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
