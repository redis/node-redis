export function transformArguments(key: string, iter: number, data: string): Array<string> {
    return ['BF.LOADCHUNK', key, iter.toString(), data];
}

export declare function transformReply(): 'OK';
