import { BlobStringReply, NullReply, Command } from '../RESP/types';
import { Tail } from './generic-transformers';
import { parseXAddArguments } from './XADD';

export default {
  IS_READ_ONLY: false,
  parseCommand(...args: Tail<Parameters<typeof parseXAddArguments>>) {
    return parseXAddArguments('NOMKSTREAM', ...args);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
