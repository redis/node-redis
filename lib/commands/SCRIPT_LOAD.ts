import { transformReplyString } from './generic-transformers';

export function transformArguments(script: string): Array<string> {
    return ['SCRIPT', 'LOAD', script];
}

export const transformReply = transformReplyString;
