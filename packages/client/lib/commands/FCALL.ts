import { evalFirstKeyIndex, EvalOptions, pushEvalArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = evalFirstKeyIndex;

export function transformArguments(fn: string, options?: EvalOptions): Array<string> {
    return pushEvalArguments(['FCALL', fn], options);
}

import { SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments() {
    return ['FCALL'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;

