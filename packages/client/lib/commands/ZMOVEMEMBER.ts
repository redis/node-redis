import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import ZMOVE from './ZMOVE';

export interface ZMoveMemberOptions {
  condition?: 'NX' | 'XX';
}

export default {
  parseCommand(
    parser: CommandParser,
    source: RedisArgument,
    destination: RedisArgument,
    members: RedisVariadicArgument,
    options?: ZMoveMemberOptions
  ) {
    parser.push('ZMOVEMEMBER');
    parser.pushKey(source);
    parser.pushKey(destination);

    if (options?.condition) {
      parser.push(options.condition);
    }

    parser.push('MEMBERS');
    parser.pushVariadicWithLength(members);
  },
  transformReply: ZMOVE.transformReply
} as const satisfies Command;
