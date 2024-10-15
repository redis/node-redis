import { Command, BlobStringReply, NullReply } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { TsMGetOptions, pushLatestArgument, pushFilterArgument } from './MGET';
import { pushSelectedLabelsArguments } from '.';
import { createTransformMGetLabelsReply } from './MGET_WITHLABELS';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filter: RedisVariadicArgument, selectedLabels: RedisVariadicArgument, options?: TsMGetOptions) {
    let args = pushLatestArgument(['TS.MGET'], options?.LATEST);
    args = pushSelectedLabelsArguments(args, selectedLabels);
    return pushFilterArgument(args, filter);
  },
  transformReply: createTransformMGetLabelsReply<BlobStringReply | NullReply>(),
} as const satisfies Command;
