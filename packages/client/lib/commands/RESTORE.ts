import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface RestoreOptions {
  REPLACE?: boolean;
  ABSTTL?: boolean;
  IDLETIME?: number;
  FREQ?: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    ttl: number,
    serializedValue: RedisArgument,
    options?: RestoreOptions
  ) {
    parser.push('RESTORE');
    parser.pushKey(key);
    parser.push(ttl.toString(), serializedValue);

    if (options?.REPLACE) {
      parser.push('REPLACE');
    }

    if (options?.ABSTTL) {
      parser.push('ABSTTL');
    }

    if (options?.IDLETIME) {
      parser.push('IDLETIME', options.IDLETIME.toString());
    }

    if (options?.FREQ) {
      parser.push('FREQ', options.FREQ.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
