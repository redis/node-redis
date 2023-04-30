
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { pushZInterArguments, ZInterKeyAndWeight, ZInterKeys, ZInterOptions } from './ZINTER';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    destination: RedisArgument,
    keys: ZInterKeys<RedisArgument> | ZInterKeys<ZInterKeyAndWeight>,
    options?: ZInterOptions
  ) {
    return pushZInterArguments(['ZINTERSTORE', destination], keys, options);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
