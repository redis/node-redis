import ADD from './ADD';
import ALTER from './ALTER';
import CREATE from './CREATE';
import CREATERULE from './CREATERULE';
import DECRBY from './DECRBY';
import DEL from './DEL';
import DELETERULE from './DELETERULE';
import GET from './GET';
import INCRBY from './INCRBY';
import INFO_DEBUG from './INFO_DEBUG';
import INFO from './INFO';
import MADD from './MADD';
import MGET_SELECTED_LABELS from './MGET_SELECTED_LABELS';
import MGET_WITHLABELS from './MGET_WITHLABELS';
import MGET from './MGET';
import MRANGE_GROUPBY from './MRANGE_GROUPBY';
import MRANGE_MULTIAGGR from './MRANGE_MULTIAGGR';
import MRANGE_SELECTED_LABELS_MULTIAGGR from './MRANGE_SELECTED_LABELS_MULTIAGGR';
import MRANGE_SELECTED_LABELS_GROUPBY from './MRANGE_SELECTED_LABELS_GROUPBY';
import MRANGE_SELECTED_LABELS from './MRANGE_SELECTED_LABELS';
import MRANGE_WITHLABELS_MULTIAGGR from './MRANGE_WITHLABELS_MULTIAGGR';
import MRANGE_WITHLABELS_GROUPBY from './MRANGE_WITHLABELS_GROUPBY';
import MRANGE_WITHLABELS from './MRANGE_WITHLABELS';
import MRANGE from './MRANGE';
import MREVRANGE_GROUPBY from './MREVRANGE_GROUPBY';
import MREVRANGE_MULTIAGGR from './MREVRANGE_MULTIAGGR';
import MREVRANGE_SELECTED_LABELS_MULTIAGGR from './MREVRANGE_SELECTED_LABELS_MULTIAGGR';
import MREVRANGE_SELECTED_LABELS_GROUPBY from './MREVRANGE_SELECTED_LABELS_GROUPBY';
import MREVRANGE_SELECTED_LABELS from './MREVRANGE_SELECTED_LABELS';
import MREVRANGE_WITHLABELS_MULTIAGGR from './MREVRANGE_WITHLABELS_MULTIAGGR';
import MREVRANGE_WITHLABELS_GROUPBY from './MREVRANGE_WITHLABELS_GROUPBY';
import MREVRANGE_WITHLABELS from './MREVRANGE_WITHLABELS';
import MREVRANGE from './MREVRANGE';
import QUERYINDEX from './QUERYINDEX';
import RANGE_MULTIAGGR from './RANGE_MULTIAGGR';
import RANGE from './RANGE';
import REVRANGE_MULTIAGGR from './REVRANGE_MULTIAGGR';
import REVRANGE from './REVRANGE';
import { RedisCommands } from '@redis/client/dist/lib/RESP/types';

export * from './helpers';

export default {
  /**
   * Creates or appends a sample to a time series
   * @param key - The key name for the time series
   * @param timestamp - The timestamp of the sample
   * @param value - The value of the sample
   * @param options - Optional configuration parameters
   */
  ADD,
  /**
   * Creates or appends a sample to a time series
   * @param key - The key name for the time series
   * @param timestamp - The timestamp of the sample
   * @param value - The value of the sample
   * @param options - Optional configuration parameters
   */
  add: ADD,
  /**
   * Alters the configuration of an existing time series
   * @param key - The key name for the time series
   * @param options - Configuration parameters to alter
   */
  ALTER,
  /**
   * Alters the configuration of an existing time series
   * @param key - The key name for the time series
   * @param options - Configuration parameters to alter
   */
  alter: ALTER,
  /**
   * Creates a new time series
   * @param key - The key name for the new time series
   * @param options - Optional configuration parameters
   */
  CREATE,
  /**
   * Creates a new time series
   * @param key - The key name for the new time series
   * @param options - Optional configuration parameters
   */
  create: CREATE,
  /**
   * Creates a compaction rule from source time series to destination time series
   * @param sourceKey - The source time series key
   * @param destinationKey - The destination time series key
   * @param aggregationType - The aggregation type to use
   * @param bucketDuration - The duration of each bucket in milliseconds
   * @param alignTimestamp - Optional timestamp for alignment
   */
  CREATERULE,
  /**
   * Creates a compaction rule from source time series to destination time series
   * @param sourceKey - The source time series key
   * @param destinationKey - The destination time series key
   * @param aggregationType - The aggregation type to use
   * @param bucketDuration - The duration of each bucket in milliseconds
   * @param alignTimestamp - Optional timestamp for alignment
   */
  createRule: CREATERULE,
  /**
   * Decreases the value of a time series by a given amount
   * @param args - Arguments passed to the parseIncrByArguments function
   */
  DECRBY,
  /**
   * Decreases the value of a time series by a given amount
   * @param args - Arguments passed to the parseIncrByArguments function
   */
  decrBy: DECRBY,
  /**
   * Deletes samples between two timestamps from a time series
   * @param key - The key name of the time series
   * @param fromTimestamp - Start timestamp to delete from
   * @param toTimestamp - End timestamp to delete until
   */
  DEL,
  /**
   * Deletes samples between two timestamps from a time series
   * @param key - The key name of the time series
   * @param fromTimestamp - Start timestamp to delete from
   * @param toTimestamp - End timestamp to delete until
   */
  del: DEL,
  /**
   * Deletes a compaction rule between source and destination time series
   * @param sourceKey - The source time series key
   * @param destinationKey - The destination time series key
   */
  DELETERULE,
  /**
   * Deletes a compaction rule between source and destination time series
   * @param sourceKey - The source time series key
   * @param destinationKey - The destination time series key
   */
  deleteRule: DELETERULE,
  /**
   * Gets the last sample of a time series
   * @param key - The key name of the time series
   * @param options - Optional parameters for the command
   */
  GET,
  /**
   * Gets the last sample of a time series
   * @param key - The key name of the time series
   * @param options - Optional parameters for the command
   */
  get: GET,
  /**
   * Increases the value of a time series by a given amount
   * @param args - Arguments passed to the {@link parseIncrByArguments} function
   */
  INCRBY,
  /**
   * Increases the value of a time series by a given amount
   * @param args - Arguments passed to the {@link parseIncrByArguments} function
   */
  incrBy: INCRBY,
  /**
   * Gets debug information about a time series
   * @param key - The key name of the time series
   */
  INFO_DEBUG,
  /**
   * Gets debug information about a time series
   * @param key - The key name of the time series
   */
  infoDebug: INFO_DEBUG,
  /**
   * Gets information about a time series
   * @param key - The key name of the time series
   */
  INFO,
  /**
   * Gets information about a time series
   * @param key - The key name of the time series
   */
  info: INFO,
  /**
   * Adds multiple samples to multiple time series
   * @param toAdd - Array of samples to add to different time series
   */
  MADD,
  /**
   * Adds multiple samples to multiple time series
   * @param toAdd - Array of samples to add to different time series
   */
  mAdd: MADD,
  /**
   * Gets the last samples matching a specific filter with selected labels
   * @param filter - Filter to match time series keys
   * @param selectedLabels - Labels to include in the output
   * @param options - Optional parameters for the command
   */
  MGET_SELECTED_LABELS,
  /**
   * Gets the last samples matching a specific filter with selected labels
   * @param filter - Filter to match time series keys
   * @param selectedLabels - Labels to include in the output
   * @param options - Optional parameters for the command
   */
  mGetSelectedLabels: MGET_SELECTED_LABELS,
  /**
   * Gets the last samples matching a specific filter with labels
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MGET_WITHLABELS,
  /**
   * Gets the last samples matching a specific filter with labels
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mGetWithLabels: MGET_WITHLABELS,
  /**
   * Gets the last samples matching a specific filter from multiple time series
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MGET,
  /**
   * Gets the last samples matching a specific filter from multiple time series
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mGet: MGET,
  /**
   * Gets samples for time series matching a filter within a time range with grouping
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  MRANGE_GROUPBY,
  /**
   * Gets samples for time series matching a filter within a time range with grouping
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  mRangeGroupBy: MRANGE_GROUPBY,
  /**
   * Gets multi-aggregation samples for time series matching a specific filter within a time range
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MRANGE_MULTIAGGR,
  /**
   * Gets multi-aggregation samples for time series matching a specific filter within a time range
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRangeMultiAggr: MRANGE_MULTIAGGR,
  /**
   * Gets multi-aggregation samples for time series matching a filter with selected labels
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MRANGE_SELECTED_LABELS_MULTIAGGR,
  /**
   * Gets multi-aggregation samples for time series matching a filter with selected labels
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRangeSelectedLabelsMultiAggr: MRANGE_SELECTED_LABELS_MULTIAGGR,
  /**
   * Gets samples for time series matching a filter with selected labels and grouping
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  MRANGE_SELECTED_LABELS_GROUPBY,
  /**
   * Gets samples for time series matching a filter with selected labels and grouping
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  mRangeSelectedLabelsGroupBy: MRANGE_SELECTED_LABELS_GROUPBY,
  /**
   * Gets samples for time series matching a filter with selected labels
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MRANGE_SELECTED_LABELS,
  /**
   * Gets samples for time series matching a filter with selected labels
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRangeSelectedLabels: MRANGE_SELECTED_LABELS,
  /**
   * Gets multi-aggregation samples for time series matching a filter with labels
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MRANGE_WITHLABELS_MULTIAGGR,
  /**
   * Gets multi-aggregation samples for time series matching a filter with labels
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRangeWithLabelsMultiAggr: MRANGE_WITHLABELS_MULTIAGGR,
  /**
   * Gets samples for time series matching a filter with labels and grouping
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  MRANGE_WITHLABELS_GROUPBY,
  /**
   * Gets samples for time series matching a filter with labels and grouping
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  mRangeWithLabelsGroupBy: MRANGE_WITHLABELS_GROUPBY,
  /**
   * Gets samples for time series matching a filter with labels
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MRANGE_WITHLABELS,
  /**
   * Gets samples for time series matching a filter with labels
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRangeWithLabels: MRANGE_WITHLABELS,
  /**
   * Gets samples for time series matching a specific filter within a time range
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MRANGE,
  /**
   * Gets samples for time series matching a specific filter within a time range
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRange: MRANGE,
  /**
   * Gets samples for time series matching a filter within a time range with grouping (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  MREVRANGE_GROUPBY,
  /**
   * Gets samples for time series matching a filter within a time range with grouping (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  mRevRangeGroupBy: MREVRANGE_GROUPBY,
  /**
   * Gets multi-aggregation samples for time series matching a specific filter within a time range (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MREVRANGE_MULTIAGGR,
  /**
   * Gets multi-aggregation samples for time series matching a specific filter within a time range (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRevRangeMultiAggr: MREVRANGE_MULTIAGGR,
  /**
   * Gets multi-aggregation samples for time series matching a filter with selected labels (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MREVRANGE_SELECTED_LABELS_MULTIAGGR,
  /**
   * Gets multi-aggregation samples for time series matching a filter with selected labels (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRevRangeSelectedLabelsMultiAggr: MREVRANGE_SELECTED_LABELS_MULTIAGGR,
  /**
   * Gets samples for time series matching a filter with selected labels and grouping (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  MREVRANGE_SELECTED_LABELS_GROUPBY,
  /**
   * Gets samples for time series matching a filter with selected labels and grouping (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  mRevRangeSelectedLabelsGroupBy: MREVRANGE_SELECTED_LABELS_GROUPBY,
  /**
   * Gets samples for time series matching a filter with selected labels (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MREVRANGE_SELECTED_LABELS,
  /**
   * Gets samples for time series matching a filter with selected labels (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param selectedLabels - Labels to include in the output
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRevRangeSelectedLabels: MREVRANGE_SELECTED_LABELS,
  /**
   * Gets multi-aggregation samples for time series matching a filter with labels (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MREVRANGE_WITHLABELS_MULTIAGGR,
  /**
   * Gets multi-aggregation samples for time series matching a filter with labels (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRevRangeWithLabelsMultiAggr: MREVRANGE_WITHLABELS_MULTIAGGR,
  /**
   * Gets samples for time series matching a filter with labels and grouping (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  MREVRANGE_WITHLABELS_GROUPBY,
  /**
   * Gets samples for time series matching a filter with labels and grouping (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param groupBy - Group by parameters
   * @param options - Optional parameters for the command
   */
  mRevRangeWithLabelsGroupBy: MREVRANGE_WITHLABELS_GROUPBY,
  /**
   * Gets samples for time series matching a filter with labels (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MREVRANGE_WITHLABELS,
  /**
   * Gets samples for time series matching a filter with labels (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRevRangeWithLabels: MREVRANGE_WITHLABELS,
  /**
   * Gets samples for time series matching a specific filter within a time range (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  MREVRANGE,
  /**
   * Gets samples for time series matching a specific filter within a time range (in reverse order)
   * @param fromTimestamp - Start timestamp for range
   * @param toTimestamp - End timestamp for range
   * @param filter - Filter to match time series keys
   * @param options - Optional parameters for the command
   */
  mRevRange: MREVRANGE,
  /**
   * Queries the index for time series matching a specific filter
   * @param filter - Filter to match time series labels
   */
  QUERYINDEX,
  /**
   * Queries the index for time series matching a specific filter
   * @param filter - Filter to match time series labels
   */
  queryIndex: QUERYINDEX,
  /**
   * Gets multi-aggregation samples from a time series within a time range
   * @param args - Arguments passed to the {@link transformRangeMultiArguments} function
   */
  RANGE_MULTIAGGR,
  /**
   * Gets multi-aggregation samples from a time series within a time range
   * @param args - Arguments passed to the {@link transformRangeMultiArguments} function
   */
  rangeMultiAggr: RANGE_MULTIAGGR,
  /**
   * Gets samples from a time series within a time range
   * @param args - Arguments passed to the {@link transformRangeArguments} function
   */
  RANGE,
  /**
   * Gets samples from a time series within a time range
   * @param args - Arguments passed to the {@link transformRangeArguments} function
   */
  range: RANGE,
  /**
   * Gets multi-aggregation samples from a time series within a time range (in reverse order)
   * @param args - Arguments passed to the {@link transformRangeMultiArguments} function
   */
  REVRANGE_MULTIAGGR,
  /**
   * Gets multi-aggregation samples from a time series within a time range (in reverse order)
   * @param args - Arguments passed to the {@link transformRangeMultiArguments} function
   */
  revRangeMultiAggr: REVRANGE_MULTIAGGR,
  /**
   * Gets samples from a time series within a time range (in reverse order)
   * @param args - Arguments passed to the {@link transformRangeArguments} function
   */
  REVRANGE,
  /**
   * Gets samples from a time series within a time range (in reverse order)
   * @param args - Arguments passed to the {@link transformRangeArguments} function
   */
  revRange: REVRANGE
} as const satisfies RedisCommands;
