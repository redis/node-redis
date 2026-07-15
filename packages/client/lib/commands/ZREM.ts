import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    member: RedisVariadicArgument
  ) {
    parser.push('ZREM');
    parser.pushKey(key);
    parser.pushVariadic(member);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
