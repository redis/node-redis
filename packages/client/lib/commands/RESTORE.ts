import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface RestoreOptions {
  REPLACE?: boolean;
  ABSTTL?: boolean;
  IDLETIME?: number;
  FREQ?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
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
    parser.pushVariadic([ttl.toString(), serializedValue]);

    if (options?.REPLACE) {
      parser.push('REPLACE');
    }

    if (options?.ABSTTL) {
      parser.push('ABSTTL');
    }

    if (options?.IDLETIME) {
      parser.pushVariadic(['IDLETIME', options.IDLETIME.toString()]);
    }

    if (options?.FREQ) {
      parser.pushVariadic(['FREQ', options.FREQ.toString()]);
    }
  },
  transformArguments(
    key: RedisArgument,
    ttl: number,
    serializedValue: RedisArgument,
    options?: RestoreOptions
  ) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
