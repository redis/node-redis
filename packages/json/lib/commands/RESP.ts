export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, path?: string): Array<string> {
    const args = ['JSON.RESP', key];

    if (path) {
        args.push(path);
    }

    return args;
}

type RESPReply = Array<string | number | RESPReply>;

export declare function transformReply(): RESPReply;
