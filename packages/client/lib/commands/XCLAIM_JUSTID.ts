import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import XCLAIM from './XCLAIM';

export default {
  IS_READ_ONLY: XCLAIM.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof XCLAIM.parseCommand>) {
    const parser = args[0];
    XCLAIM.parseCommand(...args);
    parser.push('JUSTID');
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
