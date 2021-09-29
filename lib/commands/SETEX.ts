import { TransformArgumentsReply } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string | Buffer, seconds: number, value: string): TransformArgumentsReply {
    return [
        'SETEX',
        key,
        seconds.toString(),
        value
    ];
}

export declare function transformReply(): string;
