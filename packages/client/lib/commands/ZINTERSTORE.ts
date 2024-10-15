
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { pushZInterArguments, ZInterOptions } from './ZINTER';
import { ZKeys } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    destination: RedisArgument,
    keys: ZKeys,
    options?: ZInterOptions
  ) {
    return pushZInterArguments(['ZINTERSTORE', destination], keys, options);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
