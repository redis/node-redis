export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, iterator: number): Array<string> {
    return ['CF.SCANDUMP', key, iterator.toString()];
}

type ScanDumpRawReply = [
    iterator: number,
    chunk: string | null
];

interface ScanDumpReply {
    iterator: number;
    chunk: string | null;
}

export function transformReply([iterator, chunk]: ScanDumpRawReply): ScanDumpReply {
    return {
        iterator,
        chunk
    };
}
