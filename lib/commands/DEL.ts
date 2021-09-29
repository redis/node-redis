import { TransformArgumentsReply } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(keys: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['DEL'], keys);
}

export declare function transformReply(): number;
