export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, path: string, start: number, stop: number): Array<string> {
    return ['JSON.ARRTRIM', key, path, start.toString(), stop.toString()];
}

export declare function transformReply(): number | Array<number>;
