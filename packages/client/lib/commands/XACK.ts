import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XACK command to acknowledge the processing of stream messages in a consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - The consumer group name
   * @param id - One or more message IDs to acknowledge
   * @returns The number of messages successfully acknowledged
   * @see https://redis.io/commands/xack/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument, id: RedisVariadicArgument) {
    parser.push('XACK');
    parser.pushKey(key);
    parser.push(group)
    parser.pushVariadic(id);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
 