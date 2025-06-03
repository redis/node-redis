import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

/**
 * Options for setting a consumer group's ID position
 * 
 * @property ENTRIESREAD - Set the number of entries that were read in this consumer group (Redis 7.0+)
 */
export interface XGroupSetIdOptions {
  /** added in 7.0 */
  ENTRIESREAD?: number;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XGROUP SETID command to set the last delivered ID for a consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param id - ID to set as last delivered message ('$' for last item, '0' for all items)
   * @param options - Additional options for setting the group ID
   * @returns 'OK' if successful
   * @see https://redis.io/commands/xgroup-setid/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    id: RedisArgument,
    options?: XGroupSetIdOptions
  ) {
    parser.push('XGROUP', 'SETID');
    parser.pushKey(key);
    parser.push(group, id);

    if (options?.ENTRIESREAD) {
      parser.push('ENTRIESREAD', options.ENTRIESREAD.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
