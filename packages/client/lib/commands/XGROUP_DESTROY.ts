import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

/**
 * Command for removing a consumer group
 */
export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XGROUP DESTROY command to remove a consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - Name of the consumer group to destroy
   * @returns 1 if the group was destroyed, 0 if it did not exist
   * @see https://redis.io/commands/xgroup-destroy/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument) {
    parser.push('XGROUP', 'DESTROY');
    parser.pushKey(key);
    parser.push(group);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
