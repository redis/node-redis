import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command, } from '../RESP/types';
import { ZKeys, parseZKeysArguments } from './generic-transformers';

export interface ZUnionOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    keys: ZKeys,
    options?: ZUnionOptions
  ): any {
    parser.push('ZUNIONSTORE');
    parser.pushKey(destination);
    parseZKeysArguments(parser, keys);
    
    if (options?.AGGREGATE) {
      parser.push('AGGREGATE', options.AGGREGATE);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
