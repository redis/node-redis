import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

/**
 * Options for creating a consumer group
 * 
 * @property MKSTREAM - Create the stream if it doesn't exist
 * @property ENTRIESREAD - Set the number of entries that were read in this consumer group (Redis 7.0+)
 */
export interface XGroupCreateOptions {
  MKSTREAM?: boolean;
  /**
   * added in 7.0
   */
  ENTRIESREAD?: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    id: RedisArgument,
    options?: XGroupCreateOptions
  ) {
    parser.push('XGROUP', 'CREATE');
    parser.pushKey(key);
    parser.push(group, id);

    if (options?.MKSTREAM) {
      parser.push('MKSTREAM');
    }

    if (options?.ENTRIESREAD) {
      parser.push('ENTRIESREAD', options.ENTRIESREAD.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

