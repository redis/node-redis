import { CommandParser } from '../client/parser';
import { ArrayReply, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, sha1: RedisVariadicArgument) {
    parser.push('SCRIPT', 'EXISTS');
    parser.pushVariadic(sha1);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
