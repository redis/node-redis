import { transformReplyString } from './generic-transformers';

export function transformArguments(parameter: string, value: string): Array<string> {
    return ['CONFIG', 'SET', parameter, value];
}

export const transformReply = transformReplyString;
