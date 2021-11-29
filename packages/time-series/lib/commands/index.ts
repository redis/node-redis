import * as ADD from './ADD';
import * as ALTER from './ALTER';
import * as CREATE from './CREATE';
import * as CREATERULE from './CREATERULE';
import * as DECRBY from './DECRBY';
import * as DEL from './DEL';
import * as DELETERULE from './DELETERULE';
import * as GET from './GET';
import * as INCRBY from './INCRBY';
import * as INFO_DEBUG from './INFO_DEBUG';
import * as INFO from './INFO';
import * as MADD from './MADD';
import * as MGET from './MGET';
import * as QUERYINDEX from './QUERYINDEX';
import * as RANGE from './RANGE';
import * as REVRANGE from './REVRANGE';
import { RedisCommandArguments } from '@node-redis/client/dist/lib/commands';
import { pushVerdictArguments } from '@node-redis/client/lib/commands/generic-transformers';

export default {
    ADD,
    add: ADD,
    ALTER,
    alter: ALTER,
    CREATE,
    create: CREATE,
    CREATERULE,
    createRule: CREATERULE,
    DECRBY,
    decrBy: DECRBY,
    DEL,
    del: DEL,
    DELETERULE,
    deleteRule: DELETERULE,
    GET,
    get: GET,
    INCRBY,
    incrBy: INCRBY,
    INFO_DEBUG,
    infoDebug: INFO_DEBUG,
    INFO,
    info: INFO,
    MADD,
    mAdd: MADD,
    MGET,
    mGet: MGET,
    QUERYINDEX,
    queryIndex: QUERYINDEX,
    RANGE,
    range: RANGE,
    REVRANGE,
    revRange: REVRANGE
};

export enum TimeSeriesAggregationType {
    AVARAGE = 'avg',
    SUM = 'sum',
    MINIMUM = 'min',
    MAXIMUM = 'max',
    RANGE = 'range',
    COUNT = 'count',
    FIRST = 'first',
    LAST = 'last',
    STD_P = 'std.p',
    STD_S = 'std.s',
    VAR_P = 'var.p',
    VAR_S = 'var.s'
}

export type Timestamp = number | Date | string;

export function transformTimestampArgument(timestamp: Timestamp): string {
    if (typeof timestamp === 'string') return timestamp;

    return (
        typeof timestamp === 'number' ?
            timestamp :
            timestamp.getTime()
    ).toString();
}

export function pushRetentionArgument(args: RedisCommandArguments, retention?: number): RedisCommandArguments {
    if (retention) {
        args.push(
            'RETENTION',
            retention.toString()
        );
    }

    return args;
}

export enum TimeSeriesEncoding {
    COMPRESSED = 'COMPRESSED',
    UNCOMPRESSED = 'UNCOMPRESSED'
}

export function pushEncodingArgument(args: RedisCommandArguments, encoding?: TimeSeriesEncoding): RedisCommandArguments {
    if (encoding) {
        args.push(
            'ENCODING',
            encoding
        );
    }

    return args;
}

export function pushChunkSizeArgument(args: RedisCommandArguments, chunkSize?: number): RedisCommandArguments {
    if (chunkSize) {
        args.push(
            'CHUNK_SIZE',
            chunkSize.toString()
        );
    }

    return args;
}

export enum TimeSeriesDuplicatePolicies {
    BLOCK = 'BLOCK',
    FIRST = 'FIRST',
    LAST = 'LAST',
    MIN = 'MIN',
    MAX = 'MAX',
    SUM = 'SUM'
}

export type Labels = {
    [label: string]: string;
};

export function pushLabelsArgument(args: RedisCommandArguments, labels?: Labels): RedisCommandArguments {
    if (labels) {
        args.push('LABELS');

        for (const [label, value] of Object.entries(labels)) {
            args.push(label, value);
        }
    }

    return args;
}

export interface IncrDecrOptions {
    TIMESTAMP?: Timestamp;
    RETENTION?: number;
    UNCOMPRESSED?: boolean;
    CHUNK_SIZE?: number;
    LABELS?: Labels;
}

export function transformIncrDecrArguments(
    command: 'TS.INCRBY' | 'TS.DECRBY',
    key: string,
    value: number,
    options?: IncrDecrOptions
): RedisCommandArguments {
    const args = [
        command,
        key,
        value.toString()
    ];

    if (options?.TIMESTAMP) {
        args.push('TIMESTAMP', transformTimestampArgument(options.TIMESTAMP));
    }

    pushRetentionArgument(args, options?.RETENTION);

    if (options?.UNCOMPRESSED) {
        args.push('UNCOMPRESSED');
    }

    pushChunkSizeArgument(args, options?.CHUNK_SIZE);

    pushLabelsArgument(args, options?.LABELS);

    return args;
}

export type SampleRawReply = [timestamp: number, value: string];

export interface SampleReply {
    timestamp: number;
    value: number;
}

export function transformSampleReply(reply: SampleRawReply): SampleReply {
    return {
        timestamp: reply[0],
        value: Number(reply[1])
    };
}

export interface RangeOptions {
    FILTER_BY_TS?: string | Array<string>;
    FILTER_BY_VALUE?: {
        min: number;
        max: number;
    };
    COUNT?: number;
    ALIGN?: Timestamp;
    AGGREGATION?: {
        type: TimeSeriesAggregationType;
        timeBucket: Timestamp;
    };
}

export function pushRangeArguments(
    args: RedisCommandArguments,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    options?: RangeOptions
): RedisCommandArguments {
    args.push(
        transformTimestampArgument(fromTimestamp),
        transformTimestampArgument(toTimestamp)
    );

    if (options?.FILTER_BY_TS) {
        args.push('FILTER_BY_TS');
        pushVerdictArguments(args, options.FILTER_BY_TS);
    }

    if (options?.FILTER_BY_VALUE) {
        args.push(
            'FILTER_BY_VALUE',
            options.FILTER_BY_VALUE.min.toString(),
            options.FILTER_BY_VALUE.max.toString()
        );
    }

    if (options?.COUNT) {
        args.push(
            'COUNT',
            options.COUNT.toString()
        );
    }

    if (options?.ALIGN) {
        args.push(
            'ALIGN',
            transformTimestampArgument(options.ALIGN)
        );
    }

    if (options?.AGGREGATION) {
        args.push(
            'AGGREGATION',
            options.AGGREGATION.type,
            transformTimestampArgument(options.AGGREGATION.timeBucket)
        );
    }

    return args;
}

export function transformRangeReply(reply: Array<SampleRawReply>): Array<SampleReply> {
    return reply.map(transformSampleReply);
}
