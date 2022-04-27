export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, item: string): Array<string> {
    return ['BF.EXISTS', key, item];
}

export { transformBooleanReply as transformReply } from '@redis/client/dist/lib/commands/generic-transformers';
