import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, destination: RedisArgument, keys: RedisVariadicArgument) {
    parser.push('SINTERSTORE');
    parser.pushKey(destination)
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
