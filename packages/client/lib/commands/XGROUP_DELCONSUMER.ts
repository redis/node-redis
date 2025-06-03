import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

/**
 * Command for removing a consumer from a consumer group
 */
export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XGROUP DELCONSUMER command to remove a consumer from a consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer to remove 
   * @returns The number of pending messages owned by the deleted consumer
   * @see https://redis.io/commands/xgroup-delconsumer/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument
  ) {
    parser.push('XGROUP', 'DELCONSUMER');
    parser.pushKey(key);
    parser.push(group, consumer);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
