export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, ...items: Array<string>): Array<string> {
    return ['CMS.QUERY', key, ...items];
}

export declare function transformReply(): Array<number>;
