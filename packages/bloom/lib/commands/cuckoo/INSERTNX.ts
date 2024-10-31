import { Command } from '@redis/client/lib/RESP/types';
import INSERT, { parseCfInsertArguments } from './INSERT';

export default {
  IS_READ_ONLY: INSERT.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof parseCfInsertArguments>) {
    args[0].push('CF.INSERTNX');
    parseCfInsertArguments(...args);
  },
  transformReply: INSERT.transformReply
} as const satisfies Command;
