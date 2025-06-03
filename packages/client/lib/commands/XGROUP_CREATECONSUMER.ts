import { CommandParser } from '../client/parser';
import { RedisArgument, Command, NumberReply } from '../RESP/types';

/**
 * Command for creating a new consumer in a consumer group
 */
export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XGROUP CREATECONSUMER command to create a new consumer in a consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer to create
   * @returns 1 if the consumer was created, 0 if it already existed
   * @see https://redis.io/commands/xgroup-createconsumer/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument
  ) {
    parser.push('XGROUP', 'CREATECONSUMER');
    parser.pushKey(key);
    parser.push(group, consumer);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
