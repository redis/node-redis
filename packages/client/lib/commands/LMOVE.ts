import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { ListSide } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the LMOVE command
   * 
   * @param parser - The command parser
   * @param source - The source list key
   * @param destination - The destination list key
   * @param sourceSide - The side to pop from (LEFT or RIGHT)
   * @param destinationSide - The side to push to (LEFT or RIGHT)
   * @see https://redis.io/commands/lmove/
   */
  parseCommand(
    parser: CommandParser,
    source: RedisArgument,
    destination: RedisArgument,
    sourceSide: ListSide,
    destinationSide: ListSide
  ) {
    parser.push('LMOVE');
    parser.pushKeys([source, destination]);
    parser.push(sourceSide, destinationSide);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
