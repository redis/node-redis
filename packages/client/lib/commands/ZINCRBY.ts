import { RedisArgument, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { transformDoubleArgument, transformDoubleReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    increment: number,
    member: RedisArgument
  ) {
    parser.push('ZINCRBY');
    parser.pushKey(key);
    parser.pushVariadic([transformDoubleArgument(increment), member]);
  },
  transformArguments(key: RedisArgument, increment: number, member: RedisArgument) { return [] },
  transformReply: transformDoubleReply
} as const satisfies Command;
