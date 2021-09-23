import { TransformArgumentsReply } from '.';
import { transformReplyString } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string | Buffer, seconds: number, value: string): TransformArgumentsReply {
    return [
        'SETEX',
        key,
        seconds.toString(),
        value
    ];
}

export const transformReply = transformReplyString;
