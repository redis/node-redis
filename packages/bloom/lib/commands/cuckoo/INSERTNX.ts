import { Command } from '@redis/client/dist/lib/RESP/types';
import INSERT, { parseCfInsertArguments } from './INSERT';

/**
 * Adds one or more items to a Cuckoo Filter only if they do not exist yet, creating the filter if needed
 * @param parser - The command parser
 * @param key - The name of the Cuckoo filter
 * @param items - One or more items to add to the filter
 * @param options - Optional parameters for filter creation
 * @param options.CAPACITY - The number of entries intended to be added to the filter
 * @param options.NOCREATE - If true, prevents automatic filter creation
 */
export default {
  IS_READ_ONLY: INSERT.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof parseCfInsertArguments>) {
    args[0].push('CF.INSERTNX');
    parseCfInsertArguments(...args);
  },
  transformReply: INSERT.transformReply
} as const satisfies Command;
