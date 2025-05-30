import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Pops an element from a list, pushes it to another list and returns it; blocks until element is available
   * @param parser - The Redis command parser
   * @param source - Key of the source list to pop from
   * @param destination - Key of the destination list to push to
   * @param timeout - Maximum seconds to block, 0 to block indefinitely
   */
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, timeout: number) {
    parser.push('BRPOPLPUSH');
    parser.pushKeys([source, destination]);
    parser.push(timeout.toString());
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
