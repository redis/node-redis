import { RedisArgument, NumberReply, Command, } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { ZKeys, parseZKeysArguments } from './generic-transformers';

export interface ZUnionOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  FIRST_KEY_INDEX: 1,
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
      parser.pushVariadic(['AGGREGATE', options.AGGREGATE]);
    }
  },
  transformArguments(destination: RedisArgument, keys: ZKeys, options?: ZUnionOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
