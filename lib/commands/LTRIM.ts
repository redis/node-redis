export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, start: number, stop: number): Array<string> {
    return [
        'LTRIM',
        key,
        start.toString(),
        stop.toString()
    ];
}

export declare function transformReply(): string;
