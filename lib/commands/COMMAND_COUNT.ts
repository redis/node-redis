import { TransformArgumentsReply } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(): TransformArgumentsReply {
    return ['COMMAND', 'COUNT'];
}

declare function transformReply(): number;
