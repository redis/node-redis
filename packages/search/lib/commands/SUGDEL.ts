export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, string: string): Array<string> {
    return ['FT.SUGDEL', key, string];
}

export { transformBooleanReply as transformReply } from '@redis/client/dist/lib/commands/generic-transformers';
