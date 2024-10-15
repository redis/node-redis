import { BlobStringReply, Command } from '../RESP/types';
import HSCAN from './HSCAN';

export default {
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof HSCAN.parseCommand>) {
    const parser = args[0];

    HSCAN.parseCommand(...args);
    parser.push('NOVALUES');
  },
  transformReply([cursor, fields]: [BlobStringReply, Array<BlobStringReply>]) {
    return {
      cursor,
      fields
    };
  }
} as const satisfies Command;
