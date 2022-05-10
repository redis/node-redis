import { evalFirstKeyIndex, EvalOptions, pushEvalArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = evalFirstKeyIndex;

export function transformArguments(script: string, options?: EvalOptions): Array<string> {
    return pushEvalArguments(['EVAL', script], options);
}
