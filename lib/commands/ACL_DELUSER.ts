import { TransformArgumentsReply } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(username: string | Array<string>): TransformArgumentsReply {
    return pushVerdictArguments(['ACL', 'DELUSER'], username);
}

export declare const transformReply: (reply: number) => number;
