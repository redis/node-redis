import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, destination: RedisArgument, inputKeys: RedisVariadicArgument) {
    parser.push('ZDIFFSTORE');
    parser.pushKey(destination);
    parser.pushKeysLength(inputKeys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
