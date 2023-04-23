import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanOptions, pushScanArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    cursor: number,
    options?: ScanOptions
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
