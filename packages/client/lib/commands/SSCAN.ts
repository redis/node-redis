import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, pushScanArguments } from './SCAN';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    cursor: number,
    options?: ScanCommonOptions
  ) {
    return pushScanArguments(['SSCAN', key], cursor, options);
  },
  transformReply([cursor, members]: [BlobStringReply, Array<BlobStringReply>]) {
    return {
      cursor: Number(cursor),
      members
    };
  }
} as const satisfies Command;
