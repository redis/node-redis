import { Command } from '../RESP/types';
import EVAL, { parseEvalArguments, transformEvalArguments } from './EVAL';

export default {
  FIRST_KEY_INDEX: EVAL.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  parseCommand: parseEvalArguments.bind(undefined, 'EVAL_RO'),
  transformArguments: transformEvalArguments.bind(undefined, 'EVAL_RO'),
  transformReply: EVAL.transformReply
} as const satisfies Command;
