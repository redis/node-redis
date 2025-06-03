import { Command } from '../RESP/types';
import EVAL, { parseEvalArguments } from './EVAL';

export default {
  IS_READ_ONLY: true,
  /**
   * Executes a read-only Lua script server side
   * @param parser - The Redis command parser
   * @param script - Lua script to execute
   * @param options - Script execution options including keys and arguments
   */
  parseCommand(...args: Parameters<typeof parseEvalArguments>) {
    args[0].push('EVAL_RO');
    parseEvalArguments(...args);
  },
  transformReply: EVAL.transformReply
} as const satisfies Command;
