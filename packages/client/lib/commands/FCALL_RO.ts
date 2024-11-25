import { Command } from '../RESP/types';
import EVAL, { parseEvalArguments } from './EVAL';

export default {
  IS_READ_ONLY: false,
  parseCommand(...args: Parameters<typeof parseEvalArguments>) {
    args[0].push('FCALL_RO');
    parseEvalArguments(...args);
  },
  transformReply: EVAL.transformReply
} as const satisfies Command;
