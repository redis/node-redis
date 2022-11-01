import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import * as ADD from './ADD';
import * as BYRANK from './BYRANK';
import * as BYREVRANK from './BYREVRANK';
import * as CDF from './CDF';
import * as CREATE from './CREATE';
import * as INFO from './INFO';
import * as MAX from './MAX';
import * as MERGE from './MERGE';
import * as MIN from './MIN';
import * as QUANTILE from './QUANTILE';
import * as RANK from './RANK';
import * as RESET from './RESET';
import * as REVRANK from './REVRANK';
import * as TRIMMED_MEAN from './TRIMMED_MEAN';

export default {
    ADD,
    add: ADD,
    BYRANK,
    byRank: BYRANK,
    BYREVRANK,
    byRevRank: BYREVRANK,
    CDF,
    cdf: CDF,
    CREATE,
    create: CREATE,
    INFO,
    info: INFO,
    MAX,
    max: MAX,
    MERGE,
    merge: MERGE,
    MIN,
    min: MIN,
    QUANTILE,
    quantile: QUANTILE,
    RANK,
    rank: RANK,
    RESET,
    reset: RESET,
    REVRANK,
    revRank: REVRANK,
    TRIMMED_MEAN,
    trimmedMean: TRIMMED_MEAN
};

export interface CompressionOption {
    COMPRESSION?: number;
}

export function pushCompressionArgument(
    args: RedisCommandArguments,
    options?: CompressionOption
): RedisCommandArguments {
    if (options?.COMPRESSION) {
        args.push('COMPRESSION', options.COMPRESSION.toString());
    }

    return args;
}

export function transformDoubleReply(reply: string): number {
    switch (reply) {
        case 'inf':
            return Infinity;

        case '-inf':
            return -Infinity;

        case 'nan':
            return NaN;

        default:
            return parseFloat(reply);
    }
}

export function transformDoublesReply(reply: Array<string>): Array<number> {
    return reply.map(transformDoubleReply);
}
