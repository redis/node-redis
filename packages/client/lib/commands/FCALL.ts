import { Command } from '../RESP/types';
import EVAL, { parseEvalArguments, transformEvalArguments } from './EVAL';

export default {
  FIRST_KEY_INDEX: EVAL.FIRST_KEY_INDEX,
  IS_READ_ONLY: false,
  parseCommand: parseEvalArguments.bind(undefined, 'FCALL'),
  transformArguments: transformEvalArguments.bind(undefined, 'FCALL'),
  transformReply: EVAL.transformReply
} as const satisfies Command;
