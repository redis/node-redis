import { transformReplyNumberNull } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(source: string, destination: string, timeout: number): Array<string> {
    return ['BRPOPLPUSH', source, destination, timeout.toString()];
}

export const transformReply = transformReplyNumberNull;
