export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, milliseconds: number): Array<string> {
    return ['PEXPIRE', key, milliseconds.toString()];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
