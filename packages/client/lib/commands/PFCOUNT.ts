import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('PFCOUNT');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
