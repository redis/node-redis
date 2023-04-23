import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanOptions, pushScanArguments } from './generic-transformers';

export interface HScanEntry {
  field: BlobStringReply;
  value: BlobStringReply;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    cursor: number,
    options?: ScanOptions
  ) {
    return pushScanArguments(['HSCAN', key], cursor, options);
  },
  transformReply([cursor, rawEntries]: [BlobStringReply, Array<BlobStringReply>]) {
    const entries = [];
    let i = 0;
    while (i < rawEntries.length) {
      entries.push({
        field: rawEntries[i++],
        value: rawEntries[i++]
      } satisfies HScanEntry);
    }

    return {
      cursor: Number(cursor),
      entries
    };
  }
} as const satisfies Command;
