import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, pushScanArguments } from './SCAN';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) {
    const args = pushScanArguments(['HSCAN', key], cursor, options);
    args.push('VALUES');

    return args;
  },
  transformReply: undefined as unknown as () => [BlobStringReply, Array<BlobStringReply>]
} as const satisfies Command;
