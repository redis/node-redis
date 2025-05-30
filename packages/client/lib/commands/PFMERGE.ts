import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  /**
   * Constructs the PFMERGE command
   * 
   * @param parser - The command parser
   * @param destination - The destination key to merge to
   * @param sources - One or more source keys to merge from
   * @see https://redis.io/commands/pfmerge/
   */
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    sources?: RedisVariadicArgument
  ) {
    parser.push('PFMERGE');
    parser.pushKey(destination);
    if (sources) {
      parser.pushKeys(sources);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
