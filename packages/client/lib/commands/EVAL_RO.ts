import { Command } from '../RESP/types';
import EVAL, { parseEvalArguments } from './EVAL';

export default {
  parseCommand(...args: Parameters<typeof parseEvalArguments>) {
    args[0].push('EVAL_RO');
    parseEvalArguments(...args);
  },
  transformReply: EVAL.transformReply
} as const satisfies Command;
