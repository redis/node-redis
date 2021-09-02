import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(numberOfReplicas: number, timeout: number): Array<string> {
    return ['WAIT', numberOfReplicas.toString(), timeout.toString()];
}

export const transformReply = transformReplyNumber;
