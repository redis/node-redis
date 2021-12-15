export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, item: string): Array<string> {
    return ['CF.ADDNX', key, item];
}

export { transformStringReply as transformReply } from '.';
