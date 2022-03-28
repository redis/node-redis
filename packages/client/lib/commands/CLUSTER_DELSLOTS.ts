import { RedisCommandArguments } from '.';
import { pushVerdictNumberArguments } from './generic-transformers';

export function transformArguments(slots: number | Array<number>): RedisCommandArguments {
    return pushVerdictNumberArguments(
        ['CLUSTER', 'DELSLOTS'],
        slots
    );
}

export declare function transformReply(): 'OK';
