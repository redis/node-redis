export const FIRST_KEY_INDEX = 2;

interface XGroupCreateOptions {
    MKSTREAM?: true;
}

export function transformArguments(key: string, group: string, id: string, options?: XGroupCreateOptions): Array<string> {
    const args = ['XGROUP', 'CREATE', key, group, id];

    if (options?.MKSTREAM) {
        args.push('MKSTREAM');
    }

    return args;
}

export declare function transformReply(): string;
