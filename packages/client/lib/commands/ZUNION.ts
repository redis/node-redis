import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { ZKeys, parseZKeysArguments } from './generic-transformers';

export interface ZUnionOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: ZKeys, options?: ZUnionOptions) {
    parser.push('ZUNION');
    parseZKeysArguments(parser, keys);

    if (options?.AGGREGATE) {
      parser.pushVariadic(['AGGREGATE', options.AGGREGATE]);
    }
  },
  transformArguments(keys: ZKeys, options?: ZUnionOptions) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
