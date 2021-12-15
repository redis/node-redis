export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, ...items: Array<string>): Array<string> {
    return ['BF.MADD', key, ...items];
}

export { transformArrayReply as transformReply } from '.';