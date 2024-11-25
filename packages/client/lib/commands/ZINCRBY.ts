import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { transformDoubleArgument, transformDoubleReply } from './generic-transformers';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    increment: number,
    member: RedisArgument
  ) {
    parser.push('ZINCRBY');
    parser.pushKey(key);
    parser.push(transformDoubleArgument(increment), member);
  },
  transformReply: transformDoubleReply
} as const satisfies Command;
