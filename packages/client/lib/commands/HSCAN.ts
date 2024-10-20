import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, parseScanArguments } from './SCAN';

export interface HScanEntry {
  field: BlobStringReply;
  value: BlobStringReply;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) {
    parser.push('HSCAN');
    parser.pushKey(key);
    parseScanArguments(parser, cursor, options);
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
      cursor,
      entries
    };
  }
} as const satisfies Command;
