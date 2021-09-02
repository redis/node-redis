import { transformReplyString } from './generic-transformers';

export function transformArguments(slot: number, count: number): Array<string> {
    return ['CLUSTER', 'GETKEYSINSLOT', slot.toString(), count.toString()];
}

export const transformReply = transformReplyString;
