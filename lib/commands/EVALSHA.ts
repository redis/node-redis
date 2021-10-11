import { EvalOptions, pushEvalArguments } from './generic-transformers';

export function transformArguments(sha1: string, options?: EvalOptions): Array<string> {
    return pushEvalArguments(['EVALSHA', sha1], options);
}
