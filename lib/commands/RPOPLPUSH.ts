import {  transformReplyNumberNull } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(source: string, destination: string): Array<string> {
    return ['RPOPLPUSH', source, destination];
}

export const transformReply = transformReplyNumberNull;
