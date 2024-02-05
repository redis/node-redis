import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export interface TDigestMergeOptions {
  COMPRESSION?: number;
  OVERRIDE?: boolean;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(
    destination: RedisArgument,
    source: RedisVariadicArgument,
    options?: TDigestMergeOptions
  ) {
    const args = pushVariadicArgument(['TDIGEST.MERGE', destination], source);

    if (options?.COMPRESSION !== undefined) {
      args.push('COMPRESSION', options.COMPRESSION.toString());
    }

    if (options?.OVERRIDE) {
      args.push('OVERRIDE');
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
