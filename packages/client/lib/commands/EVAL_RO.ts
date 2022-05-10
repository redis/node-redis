import { evalFirstKeyIndex, EvalOptions, pushEvalArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = evalFirstKeyIndex;

export const IS_READ_ONLY = true;

export function transformArguments(script: string, options?: EvalOptions): Array<string> {
    return pushEvalArguments(['EVAL_RO', script], options);
}
