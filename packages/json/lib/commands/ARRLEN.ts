export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, path?: string): Array<string> {
    const args = ['JSON.ARRLEN', key];

    if (path) {
        args.push(path);
    }

    return args;
}

export declare function transformReply(): number | Array<number>;
