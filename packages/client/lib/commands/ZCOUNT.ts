import { transformArgumentNumberInfinity } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, min: number, max: number): Array<string> {
    return [
        'ZCOUNT',
        key,
        transformArgumentNumberInfinity(min),
        transformArgumentNumberInfinity(max)
    ];
}

export declare function transformReply(): number;
