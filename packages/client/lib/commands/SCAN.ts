import { RedisArgument, BlobStringReply, ArrayReply, Command } from '../RESP/types';
import { ScanOptions, pushScanArguments } from './generic-transformers';

export interface ScanCommandOptions extends ScanOptions {
  TYPE?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  transformArguments(cursor: number, options?: ScanCommandOptions) {
    const args = pushScanArguments(['SCAN'], cursor, options);

    if (options?.TYPE) {
      args.push('TYPE', options.TYPE);
    }

    return args;
  },
  transformReply([cursor, keys]: [BlobStringReply, ArrayReply<BlobStringReply>]) {
    return {
      cursor: Number(cursor),
      keys
    };
  }
} as const satisfies Command;
