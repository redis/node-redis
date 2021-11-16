export const FIRST_KEY_INDEX = 2;

export function transformArguments(key: string, path?: string): Array<string> {
    const args = ['JSON.DEBUG', 'MEMORY', key];

    if (path) {
        args.push(path);
    }

    return args;
}

export declare function transformReply(): number;
