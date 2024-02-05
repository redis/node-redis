import { Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { TsMGetOptions, pushLatestArgument, pushFilterArgument } from './MGET';
import { pushWithLabelsArgument } from '.';

export interface TsMGetWithLabelsOptions extends TsMGetOptions {
  SELECTED_LABELS?: RedisVariadicArgument;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument, options?: TsMGetWithLabelsOptions) {
    let args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    args = pushWithLabelsArgument(args, options?.SELECTED_LABELS);
    return pushFilterArgument(args, filter);
  },
  // TODO
  transformReply: undefined as unknown as () => any
} as const satisfies Command;
