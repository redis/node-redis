export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, path: string, by: number): Array<string> {
    return ['JSON.NUMMULTBY', key, path, by.toString()];
}

export { transformNumbersReply as transformReply } from '.';
