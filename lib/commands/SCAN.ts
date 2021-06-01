export const IS_READ_ONLY = true;

export interface ScanOptions {
    MATCH?: string;
    COUNT?: number;
    TYPE?: string;
}

export function transformArguments(cursor: number, options?: ScanOptions): Array<string> {
    const args = ['SCAN', cursor.toString()];

    if (options?.MATCH) {
        args.push('MATCH', options.MATCH);
    }

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    if (options?.TYPE) {
        args.push('TYPE', options.TYPE);
    }
    
    return args;
}

interface ScanReply {
    cursor: number;
    keys: Array<string>
}

export function transformReply(reply: [string, Array<string>]): ScanReply {
    return {
        cursor: Number(reply[0]),
        keys: reply[1]
    };
}
