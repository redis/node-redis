export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, start: number, stop: number): Array<string> {
    return [
        'LRANGE',
        key,
        start.toString(),
        stop.toString()
    ];
}

export declare function transformReply(): Array<string>;
