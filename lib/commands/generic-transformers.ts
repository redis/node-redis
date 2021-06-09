export function transformReplyNumber(reply: number): number {
    return reply;
}

export function transformReplyString(reply: string): string {
    return reply;
}

export function transformReplyStringArray(reply: Array<string>): Array<string> {
    return reply;
}

export function transformReplyBoolean(reply: number): boolean {
    return reply === 1;
}

export function transformReplyBooleanArray(reply: Array<number>): Array<boolean> {
    return reply.map(transformReplyBoolean);
}

export interface ScanOptions {
    MATCH?: string;
    COUNT?: number;
}

export function transformScanArguments(cursor: number, options?: ScanOptions): Array<string> {
    const args = [cursor.toString()];

    if (options?.MATCH) {
        args.push('MATCH', options.MATCH);
    }

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }
    
    return args;
}

export interface ScanReply {
    cursor: number;
    keys: Array<string>
}

export function transformScanReply([cursor, keys]: [string, Array<string>]): ScanReply {
    return {
        cursor: Number(cursor),
        keys
    };
}
