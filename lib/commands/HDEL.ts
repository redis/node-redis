import { TransformArgumentsReply } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, field: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['HDEL', key], field);
}

export declare function transformReply(): number;
