export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, iter: number): Array<string> {
    return ['CF.SCANDUMP', key, iter.toString()];
}

type ScanDumpReply = [iter: number, data: string];

export function transformReply([itererator, data]: [string, string]): ScanDumpReply {
    return [
        Number(itererator),
        data
    ]; 
}
