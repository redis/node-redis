import { evalFirstKeyIndex, EvalOptions, pushEvalArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = evalFirstKeyIndex;

export function transformArguments(sha1: string, options?: EvalOptions): Array<string> {
    return pushEvalArguments(['EVALSHA', sha1], options);
}
