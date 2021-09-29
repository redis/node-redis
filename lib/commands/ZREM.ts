import { TransformArgumentsReply } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, member: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['ZREM', key], member);
}

export declare function transformReply(): number;
