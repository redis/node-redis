import { ArrayReply, BlobStringReply, Command, MapReply, NumberReply, RedisArgument, ReplyUnion, TypeMapping, UnwrapReply } from '@redis/client/dist/lib/RESP/types';
import { RediSearchProperty } from './CREATE';
import { FtSearchParams, pushParamsArgument } from './SEARCH';
import { pushVariadicArgument, transformTuplesReply } from '@redis/client/dist/lib/commands/generic-transformers';

type LoadField = RediSearchProperty | {
  identifier: RediSearchProperty;
  AS?: RedisArgument;
}

export const FT_AGGREGATE_STEPS = {
  GROUPBY: 'GROUPBY',
  SORTBY: 'SORTBY',
  APPLY: 'APPLY',
  LIMIT: 'LIMIT',
  FILTER: 'FILTER'
} as const;

type FT_AGGREGATE_STEPS = typeof FT_AGGREGATE_STEPS;

export type FtAggregateStep = FT_AGGREGATE_STEPS[keyof FT_AGGREGATE_STEPS];

interface AggregateStep<T extends FtAggregateStep> {
  type: T;
}

export const FT_AGGREGATE_GROUP_BY_REDUCERS = {
  COUNT: 'COUNT',
  COUNT_DISTINCT: 'COUNT_DISTINCT',
  COUNT_DISTINCTISH: 'COUNT_DISTINCTISH',
  SUM: 'SUM',
  MIN: 'MIN',
  MAX: 'MAX',
  AVG: 'AVG',
  STDDEV: 'STDDEV',
  QUANTILE: 'QUANTILE',
  TOLIST: 'TOLIST',
  FIRST_VALUE: 'FIRST_VALUE',
  RANDOM_SAMPLE: 'RANDOM_SAMPLE'
} as const;

type FT_AGGREGATE_GROUP_BY_REDUCERS = typeof FT_AGGREGATE_GROUP_BY_REDUCERS;

export type FtAggregateGroupByReducer = FT_AGGREGATE_GROUP_BY_REDUCERS[keyof FT_AGGREGATE_GROUP_BY_REDUCERS];

interface GroupByReducer<T extends FtAggregateGroupByReducer> {
  type: T;
  AS?: RedisArgument;
}

interface GroupByReducerWithProperty<T extends FtAggregateGroupByReducer> extends GroupByReducer<T> {
  property: RediSearchProperty;
}

type CountReducer = GroupByReducer<FT_AGGREGATE_GROUP_BY_REDUCERS['COUNT']>;

type CountDistinctReducer = GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['COUNT_DISTINCT']>;

type CountDistinctishReducer = GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['COUNT_DISTINCTISH']>;

type SumReducer = GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['SUM']>;

type MinReducer = GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['MIN']>;

type MaxReducer = GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['MAX']>;

type AvgReducer = GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['AVG']>;

type StdDevReducer = GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['STDDEV']>;

interface QuantileReducer extends GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['QUANTILE']> {
  quantile: number;
}

type ToListReducer = GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['TOLIST']>;

interface FirstValueReducer extends GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['FIRST_VALUE']> {
  BY?: RediSearchProperty | {
    property: RediSearchProperty;
    direction?: 'ASC' | 'DESC';
  };
}

interface RandomSampleReducer extends GroupByReducerWithProperty<FT_AGGREGATE_GROUP_BY_REDUCERS['RANDOM_SAMPLE']> {
  sampleSize: number;
}

type GroupByReducers = CountReducer | CountDistinctReducer | CountDistinctishReducer | SumReducer | MinReducer | MaxReducer | AvgReducer | StdDevReducer | QuantileReducer | ToListReducer | FirstValueReducer | RandomSampleReducer;

interface GroupByStep extends AggregateStep<FT_AGGREGATE_STEPS['GROUPBY']> {
  properties?: RediSearchProperty | Array<RediSearchProperty>;
  REDUCE: GroupByReducers | Array<GroupByReducers>;
}

type SortByProperty = RedisArgument | {
  BY: RediSearchProperty;
  DIRECTION?: 'ASC' | 'DESC';
};

interface SortStep extends AggregateStep<FT_AGGREGATE_STEPS['SORTBY']> {
  BY: SortByProperty | Array<SortByProperty>;
  MAX?: number;
}

interface ApplyStep extends AggregateStep<FT_AGGREGATE_STEPS['APPLY']> {
  expression: RedisArgument;
  AS: RedisArgument;
}

interface LimitStep extends AggregateStep<FT_AGGREGATE_STEPS['LIMIT']> {
  from: number;
  size: number;
}

interface FilterStep extends AggregateStep<FT_AGGREGATE_STEPS['FILTER']> {
  expression: RedisArgument;
}

export interface FtAggregateOptions {
  VERBATIM?: boolean;
  LOAD?: LoadField | Array<LoadField>;
  TIMEOUT?: number;
  STEPS?: Array<GroupByStep | SortStep | ApplyStep | LimitStep | FilterStep>;
  PARAMS?: FtSearchParams;
  DIALECT?: number;
}

export type AggregateRawReply = [
  total: UnwrapReply<NumberReply>,
  ...results: UnwrapReply<ArrayReply<ArrayReply<BlobStringReply>>>
];

export interface AggregateReply {
  total: number;
  results: Array<MapReply<BlobStringReply, BlobStringReply>>;
};

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(index: RedisArgument, query: RedisArgument, options?: FtAggregateOptions) {
    const args = ['FT.AGGREGATE', index, query];

    return pushAggregateOptions(args, options);
  },
  transformReply: {
    2: (rawReply: AggregateRawReply, preserve?: any, typeMapping?: TypeMapping): AggregateReply => {
      const results: Array<MapReply<BlobStringReply, BlobStringReply>> = [];
      for (let i = 1; i < rawReply.length; i++) {
        results.push(
          transformTuplesReply(rawReply[i] as ArrayReply<BlobStringReply>, preserve, typeMapping)
        );
      }
  
      return {
        total: Number(rawReply[0]),
        results
      };
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3SearchModule: true
} as const satisfies Command;

export function pushAggregateOptions(args: Array<RedisArgument>, options?: FtAggregateOptions) {
  if (options?.VERBATIM) {
    args.push('VERBATIM');
  }

  if (options?.LOAD) {
    const length = args.push('LOAD', '');

    if (Array.isArray(options.LOAD)) {
      for (const load of options.LOAD) {
        pushLoadField(args, load);
      }
    } else {
      pushLoadField(args, options.LOAD);
    }

    args[length - 1] = (args.length - length).toString();
  }

  if (options?.TIMEOUT !== undefined) {
    args.push('TIMEOUT', options.TIMEOUT.toString());
  }

  if (options?.STEPS) {
    for (const step of options.STEPS) {
      args.push(step.type);
      switch (step.type) {
        case FT_AGGREGATE_STEPS.GROUPBY:
          if (!step.properties) {
            args.push('0');
          } else {
            pushVariadicArgument(args, step.properties);
          }

          if (Array.isArray(step.REDUCE)) {
            for (const reducer of step.REDUCE) {
              pushGroupByReducer(args, reducer);
            }
          } else {
            pushGroupByReducer(args, step.REDUCE);
          }

          break;

        case FT_AGGREGATE_STEPS.SORTBY:
          const length = args.push('');

          if (Array.isArray(step.BY)) {
            for (const by of step.BY) {
              pushSortByProperty(args, by);
            }
          } else {
            pushSortByProperty(args, step.BY);
          }

          if (step.MAX) {
            args.push('MAX', step.MAX.toString());
          }

          args[length - 1] = (args.length - length).toString();

          break;

        case FT_AGGREGATE_STEPS.APPLY:
          args.push(step.expression, 'AS', step.AS);
          break;

        case FT_AGGREGATE_STEPS.LIMIT:
          args.push(step.from.toString(), step.size.toString());
          break;

        case FT_AGGREGATE_STEPS.FILTER:
          args.push(step.expression);
          break;
      }
    }
  }

  pushParamsArgument(args, options?.PARAMS);

  if (options?.DIALECT !== undefined) {
    args.push('DIALECT', options.DIALECT.toString());
  }

  return args;
}

function pushLoadField(args: Array<RedisArgument>, toLoad: LoadField) {
  if (typeof toLoad === 'string' || toLoad instanceof Buffer) {
    args.push(toLoad);
  } else {
    args.push(toLoad.identifier);

    if (toLoad.AS) {
      args.push('AS', toLoad.AS);
    }
  }
}

function pushGroupByReducer(args: Array<RedisArgument>, reducer: GroupByReducers) {
  args.push('REDUCE', reducer.type);

  switch (reducer.type) {
    case FT_AGGREGATE_GROUP_BY_REDUCERS.COUNT:
      args.push('0');
      break;

    case FT_AGGREGATE_GROUP_BY_REDUCERS.COUNT_DISTINCT:
    case FT_AGGREGATE_GROUP_BY_REDUCERS.COUNT_DISTINCTISH:
    case FT_AGGREGATE_GROUP_BY_REDUCERS.SUM:
    case FT_AGGREGATE_GROUP_BY_REDUCERS.MIN:
    case FT_AGGREGATE_GROUP_BY_REDUCERS.MAX:
    case FT_AGGREGATE_GROUP_BY_REDUCERS.AVG:
    case FT_AGGREGATE_GROUP_BY_REDUCERS.STDDEV:
    case FT_AGGREGATE_GROUP_BY_REDUCERS.TOLIST:
      args.push('1', reducer.property);
      break;

    case FT_AGGREGATE_GROUP_BY_REDUCERS.QUANTILE:
      args.push('2', reducer.property, reducer.quantile.toString());
      break;

    case FT_AGGREGATE_GROUP_BY_REDUCERS.FIRST_VALUE: {
      const length = args.push('', reducer.property) - 1;
      if (reducer.BY) {
        args.push('BY');
        if (typeof reducer.BY === 'string' || reducer.BY instanceof Buffer) {
          args.push(reducer.BY);
        } else {
          args.push(reducer.BY.property);
          if (reducer.BY.direction) {
            args.push(reducer.BY.direction);
          }
        }
      }

      args[length - 1] = (args.length - length).toString();
      break;
    }

    case FT_AGGREGATE_GROUP_BY_REDUCERS.RANDOM_SAMPLE:
      args.push('2', reducer.property, reducer.sampleSize.toString());
      break;
  }

  if (reducer.AS) {
    args.push('AS', reducer.AS);
  }
}

function pushSortByProperty(args: Array<RedisArgument>, sortBy: SortByProperty) {
  if (typeof sortBy === 'string' || sortBy instanceof Buffer) {
    args.push(sortBy);
  } else {
    args.push(sortBy.BY);
    if (sortBy.DIRECTION) {
      args.push(sortBy.DIRECTION);
    }
  }
}
