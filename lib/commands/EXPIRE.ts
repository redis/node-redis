export function transformArguments(key: string, seconds: number): Array<string> {
    return ['EXPIRE', key, seconds.toString()];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
