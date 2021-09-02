import { transformReplyTuples } from './generic-transformers';

export function transformArguments(parameter: string): Array<string> {
    return ['CONFIG', 'GET', parameter];
}

export const transformReply = transformReplyTuples;
