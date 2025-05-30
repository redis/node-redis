import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

/**
 * Options for the RESTORE command
 * 
 * @property REPLACE - Replace existing key
 * @property ABSTTL - Use the TTL value as absolute timestamp
 * @property IDLETIME - Set the idle time (seconds) for the key
 * @property FREQ - Set the frequency counter for LFU policy
 */
export interface RestoreOptions {
  REPLACE?: boolean;
  ABSTTL?: boolean;
  IDLETIME?: number;
  FREQ?: number;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the RESTORE command
   * 
   * @param parser - The command parser
   * @param key - The key to restore
   * @param ttl - Time to live in milliseconds, 0 for no expiry
   * @param serializedValue - The serialized value from DUMP command
   * @param options - Options for the RESTORE command
   * @see https://redis.io/commands/restore/
   */
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
