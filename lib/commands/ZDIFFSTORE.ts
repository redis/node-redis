import { TransformArgumentsReply } from '.';
import { pushVerdictArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, keys: Array<string> | string): TransformArgumentsReply {
    return pushVerdictArgument(['ZDIFFSTORE', destination], keys);
}

export declare function transformReply(): number;
