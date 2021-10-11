import { EvalOptions, pushEvalArguments } from './generic-transformers';

export function transformArguments(script: string, options?: EvalOptions): Array<string> {
    return pushEvalArguments(['EVAL', script], options);
}
