import { RedisCommandArguments } from '.';
import { pushVerdictNumberArguments } from './generic-transformers';

export function transformArguments(slots: number | Array<number>): RedisCommandArguments {
    return pushVerdictNumberArguments(
        ['CLUSTER', 'ADDSLOTS'],
        slots
    );
}

export declare function transformReply(): string;
