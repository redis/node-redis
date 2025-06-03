import { Command } from '../RESP/types';
import EVAL, { parseEvalArguments } from './EVAL';

export default {
  IS_READ_ONLY: false,
  /**
   * Invokes a Redis function
   * @param parser - The Redis command parser
   * @param functionName - Name of the function to call
   * @param options - Function execution options including keys and arguments
   */
  parseCommand(...args: Parameters<typeof parseEvalArguments>) {
    args[0].push('FCALL');
    parseEvalArguments(...args);
  },
  transformReply: EVAL.transformReply
} as const satisfies Command;
