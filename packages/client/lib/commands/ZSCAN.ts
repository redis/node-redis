import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, pushScanArguments } from './SCAN';
import { ZMember, transformDoubleReply } from './generic-transformers';

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
    options?: ScanCommonOptions
  ) {
    return pushScanArguments(['ZSCAN', key], cursor, options);
  },
  transformReply([cursor, rawMembers]: [BlobStringReply, Array<BlobStringReply>]) {
    const members = [];
    let i = 0;
    while (i < rawMembers.length) {
      members.push({
        value: rawMembers[i++],
        score: transformDoubleReply(rawMembers[i++])
      } satisfies ZMember);
    }

    return {
      cursor: Number(cursor),
      members
    };
  }
} as const satisfies Command;
