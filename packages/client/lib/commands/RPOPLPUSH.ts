import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the RPOPLPUSH command
   * 
   * @param parser - The command parser
   * @param source - The source list key
   * @param destination - The destination list key
   * @see https://redis.io/commands/rpoplpush/
   */
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument) {
    parser.push('RPOPLPUSH');
    parser.pushKeys([source, destination]);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
