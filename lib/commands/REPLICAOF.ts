import { transformReplyString } from './generic-transformers';

export function transformArguments(host: string, port: number): Array<string> {
    return ['REPLICAOF', host, port.toString()];
}

export const transformReply = transformReplyString;
