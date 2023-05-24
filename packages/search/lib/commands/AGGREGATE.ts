import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushVerdictArgument, transformTuplesReply } from '@redis/client/dist/lib/commands/generic-transformers';
import { Params, PropertyName, pushArgumentsWithLength, pushParamsArgs, pushSortByArguments, SortByProperty } from '.';

export enum AggregateSteps {
    GROUPBY = 'GROUPBY',
    SORTBY = 'SORTBY',
    APPLY = 'APPLY',
    LIMIT = 'LIMIT',
    FILTER = 'FILTER'
}

interface AggregateStep<T extends AggregateSteps> {
    type: T;
}

export enum AggregateGroupByReducers {
    COUNT = 'COUNT',
    COUNT_DISTINCT = 'COUNT_DISTINCT',
    COUNT_DISTINCTISH = 'COUNT_DISTINCTISH',
    SUM = 'SUM',
    MIN = 'MIN',
    MAX = 'MAX',
    AVG = 'AVG',
    STDDEV = 'STDDEV',
    QUANTILE = 'QUANTILE',
    TOLIST = 'TOLIST',
    TO_LIST = 'TOLIST',
    FIRST_VALUE = 'FIRST_VALUE',
    RANDOM_SAMPLE = 'RANDOM_SAMPLE'
}

interface GroupByReducer<T extends AggregateGroupByReducers> {
    type: T;
    AS?: string;
}

type CountReducer = GroupByReducer<AggregateGroupByReducers.COUNT>;

interface CountDistinctReducer extends GroupByReducer<AggregateGroupByReducers.COUNT_DISTINCT> {
    property: PropertyName;
}

interface CountDistinctishReducer extends GroupByReducer<AggregateGroupByReducers.COUNT_DISTINCTISH> {
    property: PropertyName;
}

interface SumReducer extends GroupByReducer<AggregateGroupByReducers.SUM> {
    property: PropertyName;
}

interface MinReducer extends GroupByReducer<AggregateGroupByReducers.MIN> {
    property: PropertyName;
}

interface MaxReducer extends GroupByReducer<AggregateGroupByReducers.MAX> {
    property: PropertyName;
}

interface AvgReducer extends GroupByReducer<AggregateGroupByReducers.AVG> {
    property: PropertyName;
}

interface StdDevReducer extends GroupByReducer<AggregateGroupByReducers.STDDEV> {
    property: PropertyName;
}

interface QuantileReducer extends GroupByReducer<AggregateGroupByReducers.QUANTILE> {
    property: PropertyName;
    quantile: number;
}

interface ToListReducer extends GroupByReducer<AggregateGroupByReducers.TOLIST> {
    property: PropertyName;
}

interface FirstValueReducer extends GroupByReducer<AggregateGroupByReducers.FIRST_VALUE> {
    property: PropertyName;
    BY?: PropertyName | {
        property: PropertyName;
        direction?: 'ASC' | 'DESC';
    };
}

interface RandomSampleReducer extends GroupByReducer<AggregateGroupByReducers.RANDOM_SAMPLE> {
    property: PropertyName;
    sampleSize: number;
}

type GroupByReducers = CountReducer | CountDistinctReducer | CountDistinctishReducer | SumReducer | MinReducer | MaxReducer | AvgReducer | StdDevReducer | QuantileReducer | ToListReducer | FirstValueReducer | RandomSampleReducer;

interface GroupByStep extends AggregateStep<AggregateSteps.GROUPBY> {
    properties?: PropertyName | Array<PropertyName>;
    REDUCE: GroupByReducers | Array<GroupByReducers>;
}

interface SortStep extends AggregateStep<AggregateSteps.SORTBY> {
    BY: SortByProperty | Array<SortByProperty>;
    MAX?: number;
}

interface ApplyStep extends AggregateStep<AggregateSteps.APPLY> {
    expression: string;
    AS: string;
}

interface LimitStep extends AggregateStep<AggregateSteps.LIMIT> {
    from: number;
    size: number;
}

interface FilterStep extends AggregateStep<AggregateSteps.FILTER> {
    expression: string;
}

type LoadField = PropertyName | {
    identifier: PropertyName;
    AS?: string;
}

export interface AggregateOptions {
    VERBATIM?: true;
    LOAD?: LoadField | Array<LoadField>;
    STEPS?: Array<GroupByStep | SortStep | ApplyStep | LimitStep | FilterStep>;
    PARAMS?: Params;
    DIALECT?: number;
    TIMEOUT?: number;
}

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    index: string,
    query: string,
    options?: AggregateOptions
): RedisCommandArguments {
    return pushAggregatehOptions(
        ['FT.AGGREGATE', index, query],
        options
    );
}

export function pushAggregatehOptions(
    args: RedisCommandArguments,
    options?: AggregateOptions
): RedisCommandArguments {
    if (options?.VERBATIM) {
        args.push('VERBATIM');
    }

    if (options?.LOAD) {
        args.push('LOAD');
        pushArgumentsWithLength(args, () => {
            if (Array.isArray(options.LOAD)) {
                for (const load of options.LOAD) {
                    pushLoadField(args, load);
                }
            } else {
                pushLoadField(args, options.LOAD!);
            }
        });
    }

    if (options?.STEPS) {
        for (const step of options.STEPS) {
            switch (step.type) {
                case AggregateSteps.GROUPBY:
                    args.push('GROUPBY');
                    if (!step.properties) {
                        args.push('0');
                    } else {
                        pushVerdictArgument(args, step.properties);
                    }

                    if (Array.isArray(step.REDUCE)) {
                        for (const reducer of step.REDUCE) {
                            pushGroupByReducer(args, reducer);
                        }
                    } else {
                        pushGroupByReducer(args, step.REDUCE);
                    }

                    break;

                case AggregateSteps.SORTBY:
                    pushSortByArguments(args, 'SORTBY', step.BY);

                    if (step.MAX) {
                        args.push('MAX', step.MAX.toString());
                    }

                    break;

                case AggregateSteps.APPLY:
                    args.push('APPLY', step.expression, 'AS', step.AS);
                    break;

                case AggregateSteps.LIMIT:
                    args.push('LIMIT', step.from.toString(), step.size.toString());
                    break;

                case AggregateSteps.FILTER:
                    args.push('FILTER', step.expression);
                    break;
            }
        }
    }

    pushParamsArgs(args, options?.PARAMS);

    if (options?.DIALECT) {
        args.push('DIALECT', options.DIALECT.toString());
    }

    if (options?.TIMEOUT !== undefined) {
        args.push('TIMEOUT', options.TIMEOUT.toString());
    }

    return args;
}

function pushLoadField(args: RedisCommandArguments, toLoad: LoadField): void {
    if (typeof toLoad === 'string') {
        args.push(toLoad);
    } else {
        args.push(toLoad.identifier);

        if (toLoad.AS) {
            args.push('AS', toLoad.AS);
        }
    }
}

function pushGroupByReducer(args: RedisCommandArguments, reducer: GroupByReducers): void {
    args.push('REDUCE', reducer.type);

    switch (reducer.type) {
        case AggregateGroupByReducers.COUNT:
            args.push('0');
            break;

        case AggregateGroupByReducers.COUNT_DISTINCT:
        case AggregateGroupByReducers.COUNT_DISTINCTISH:
        case AggregateGroupByReducers.SUM:
        case AggregateGroupByReducers.MIN:
        case AggregateGroupByReducers.MAX:
        case AggregateGroupByReducers.AVG:
        case AggregateGroupByReducers.STDDEV:
        case AggregateGroupByReducers.TOLIST:
            args.push('1', reducer.property);
            break;

        case AggregateGroupByReducers.QUANTILE:
            args.push('2', reducer.property, reducer.quantile.toString());
            break;

        case AggregateGroupByReducers.FIRST_VALUE: {
            pushArgumentsWithLength(args, () => {
                args.push(reducer.property);

                if (reducer.BY) {
                    args.push('BY');
                    if (typeof reducer.BY === 'string') {
                        args.push(reducer.BY);
                    } else {
                        args.push(reducer.BY.property);

                        if (reducer.BY.direction) {
                            args.push(reducer.BY.direction);
                        }
                    }
                }
            });
            break;
        }

        case AggregateGroupByReducers.RANDOM_SAMPLE:
            args.push('2', reducer.property, reducer.sampleSize.toString());
            break;
    }

    if (reducer.AS) {
        args.push('AS', reducer.AS);
    }
}

export type AggregateRawReply = [
    total: number,
    ...results: Array<Array<RedisCommandArgument>>
];

export interface AggregateReply {
    total: number;
    results: Array<Record<string, RedisCommandArgument>>;
}

export function transformReply(rawReply: AggregateRawReply): AggregateReply {
    const results: Array<Record<string, RedisCommandArgument>> = [];
    for (let i = 1; i < rawReply.length; i++) {
        results.push(
            transformTuplesReply(rawReply[i] as Array<RedisCommandArgument>)
        );
    }

    return {
        total: rawReply[0],
        results
    };
}