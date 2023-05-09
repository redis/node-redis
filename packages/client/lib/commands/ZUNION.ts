import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { ZKeys, pushZKeysArguments } from './generic-transformers';

export interface ZUnionOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(
    keys: ZKeys,
    options?: ZUnionOptions
  ) {
    const args = pushZKeysArguments(['ZUNION'], keys);

    if (options?.AGGREGATE) {
      args.push('AGGREGATE', options.AGGREGATE);
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
