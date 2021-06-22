import { transformReplyString } from './generic-transformers';

export function transformArguments(ip: string, port: number): Array<string> {
    return ['CLUSTER', 'MEET', ip, port.toString()];
}

export const transformReply = transformReplyString;
