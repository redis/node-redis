import { TransformArgumentsReply } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(args: Array<string>): TransformArgumentsReply {
    return ['COMMAND', 'GETKEYS', ...args];
}

declare function transformReply(): Array<string>;
