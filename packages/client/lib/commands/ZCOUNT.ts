import { transformArgumentStringNumberInfinity } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, min: string | number, max: string | number): Array<string> {
    return [
        'ZCOUNT',
        key,
        transformArgumentStringNumberInfinity(min),
        transformArgumentStringNumberInfinity(max)
    ];
}

export declare function transformReply(): number;
