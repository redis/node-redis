export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, path?: string): Array<string> {
    const args = ['JSON.TYPE', key];

    if (path) {
        args.push(path);
    }

    return args;
}

export declare function transformReply(): string | null | Array<string | null>;
