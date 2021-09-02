import { transformReplyString } from './generic-transformers';

export function transformArguments(name: string): Array<string> {
    return ['MODULE', 'UNLOAD', name];
}

export const transformReply = transformReplyString;
