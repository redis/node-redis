export const FIRST_KEY_INDEX = 1;

export function transformArguments(source: string, destination: string, member: string): Array<string> {
    return ['SMOVE', source, destination, member];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
