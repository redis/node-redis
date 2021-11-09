export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, field: string, increment: number): Array<string> {
    return ['HINCRBYFLOAT', key, field, increment.toString()];
}

export declare function transformReply(): number;
