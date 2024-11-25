import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisVariadicArgument) {
    parser.push('TOUCH');
    parser.pushKeys(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
