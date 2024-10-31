import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
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
