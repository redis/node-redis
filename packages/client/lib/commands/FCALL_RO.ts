import { Command } from '../RESP/types';
import EVAL, { parseEvalArguments, transformEvalArguments } from './EVAL';

export default {
  FIRST_KEY_INDEX: EVAL.FIRST_KEY_INDEX,
  IS_READ_ONLY: false,
  parseCommand: parseEvalArguments.bind(undefined, 'FCALL_RO'),
  transformArguments: transformEvalArguments.bind(undefined, 'FCALL_RO'),
  transformReply: EVAL.transformReply
} as const satisfies Command;
