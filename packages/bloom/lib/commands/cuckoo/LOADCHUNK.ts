export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, iterator: number, chunk: string): Array<string> {
    return ['CF.LOADCHUNK', key, iterator.toString(), chunk];
}

export declare function transformReply(): 'OK';
