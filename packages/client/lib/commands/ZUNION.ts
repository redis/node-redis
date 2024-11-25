import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { ZKeys, parseZKeysArguments } from './generic-transformers';

export interface ZUnionOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: ZKeys, options?: ZUnionOptions) {
    parser.push('ZUNION');
    parseZKeysArguments(parser, keys);

    if (options?.AGGREGATE) {
      parser.push('AGGREGATE', options.AGGREGATE);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
