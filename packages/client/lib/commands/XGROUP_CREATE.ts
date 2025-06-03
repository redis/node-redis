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
  /**
   * Constructs the XGROUP CREATE command to create a consumer group for a stream
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param id - ID of the last delivered item in the stream ('$' for last item, '0' for all items)
   * @param options - Additional options for group creation
   * @returns 'OK' if successful
   * @see https://redis.io/commands/xgroup-create/
   */
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

