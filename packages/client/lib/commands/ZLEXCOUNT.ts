export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, min: string, max: string): Array<string> {
    return [
        'ZLEXCOUNT',
        key,
        min,
        max
    ];
}

export declare function transformReply(): number;
