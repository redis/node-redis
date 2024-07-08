import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, destination: RedisArgument, inputKeys: RedisVariadicArgument) {
    parser.push('ZDIFFSTORE');
    parser.pushKey(destination);
    parser.pushKeysLength(inputKeys);
  },
  transformArguments(destination: RedisArgument, inputKeys: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
