export const FIRST_KEY_INDEX = 1;

export function transformArguments(source: string, destination: string): Array<string> {
    return ['RPOPLPUSH', source, destination];
}

export declare function transformReply(): number | null;
