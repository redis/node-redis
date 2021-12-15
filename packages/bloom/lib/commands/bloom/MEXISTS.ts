export const IS_READ_ONLY = true;

export function transformArguments(key: string, ...items: Array<string>): Array<string> {
    return ['BF.MEXISTS', key, ...items];
}

export declare function transformReply(): Array<boolean>;
