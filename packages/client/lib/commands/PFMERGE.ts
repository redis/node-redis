import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
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
  transformArguments(
    destination: RedisArgument,
    sources?: RedisVariadicArgument
  ) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
