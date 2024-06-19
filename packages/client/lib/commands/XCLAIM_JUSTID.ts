import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import XCLAIM from './XCLAIM';
import { Tail } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: XCLAIM.FIRST_KEY_INDEX,
  IS_READ_ONLY: XCLAIM.IS_READ_ONLY,
  parseCommand(parser: CommandParser, ...args: Tail<Parameters<typeof XCLAIM.parseCommand>>) {
    XCLAIM.parseCommand(parser, ...args);
    parser.push('JUSTID');
  },
  transformArguments(...args: Parameters<typeof XCLAIM.transformArguments>) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
