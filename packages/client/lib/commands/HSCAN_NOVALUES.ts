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
    args.push('NOVALUES');
    return args;
  },
  transformReply([cursor, fields]: [BlobStringReply, Array<BlobStringReply>]) {
    return {
      cursor,
      fields
    };
  }
} as const satisfies Command;
