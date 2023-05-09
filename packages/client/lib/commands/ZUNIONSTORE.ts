import { RedisArgument, NumberReply, Command, } from '../RESP/types';
import { ZKeys, pushZKeysArguments } from './generic-transformers';

export interface ZUnionOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    destination: RedisArgument,
    keys: ZKeys,
    options?: ZUnionOptions
  ) {
    const args = pushZKeysArguments(['ZUNIONSTORE', destination], keys);

    if (options?.AGGREGATE) {
      args.push('AGGREGATE', options.AGGREGATE);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
