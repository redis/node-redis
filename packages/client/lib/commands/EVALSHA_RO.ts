import { Command } from '../RESP/types';
import EVAL, { parseEvalArguments } from './EVAL';

export default {
  IS_READ_ONLY: true,
  /**
   * Executes a read-only Lua script server side using the script's SHA1 digest
   * @param parser - The Redis command parser
   * @param sha1 - SHA1 digest of the script
   * @param options - Script execution options including keys and arguments
   */
  parseCommand(...args: Parameters<typeof parseEvalArguments>) {
    args[0].push('EVALSHA_RO');
    parseEvalArguments(...args);
  },
  transformReply: EVAL.transformReply
} as const satisfies Command;
