import { ArrayReply, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, sha1: RedisVariadicArgument) {
    parser.pushVariadic(['SCRIPT', 'EXISTS']);
    parser.pushVariadic(sha1);
  },
  transformArguments(sha1: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
