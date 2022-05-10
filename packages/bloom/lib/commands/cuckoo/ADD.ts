export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, item: string): Array<string> {
    return ['CF.ADD', key, item];
}

export { transformBooleanReply as transformReply } from '@redis/client/dist/lib/commands/generic-transformers';
