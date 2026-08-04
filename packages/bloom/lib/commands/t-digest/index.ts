import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';
import ADD from './ADD';
import BYRANK from './BYRANK';
import BYREVRANK from './BYREVRANK';
import CDF from './CDF';
import CREATE from './CREATE';
import INFO from './INFO';
import MAX from './MAX';
import MERGE from './MERGE';
import MIN from './MIN';
import QUANTILE from './QUANTILE';
import RANK from './RANK';
import RESET from './RESET';
import REVRANK from './REVRANK';
import TRIMMED_MEAN from './TRIMMED_MEAN';

export default {
  /**
   * Adds one or more observations to a t-digest sketch
   * @param key - The name of the t-digest sketch
   * @param values - Array of numeric values to add to the sketch
   */
  ADD,
  /**
   * Adds one or more observations to a t-digest sketch
   * @param key - The name of the t-digest sketch
   * @param values - Array of numeric values to add to the sketch
   */
  add: ADD,
  /**
   * Returns value estimates for one or more ranks in a t-digest sketch
   * @param key - The name of the t-digest sketch
   * @param ranks - Array of ranks to get value estimates for (ascending order)
   */
  BYRANK,
  /**
   * Returns value estimates for one or more ranks in a t-digest sketch
   * @param key - The name of the t-digest sketch
   * @param ranks - Array of ranks to get value estimates for (ascending order)
   */
  byRank: BYRANK,
  /**
   * Returns value estimates for one or more ranks in a t-digest sketch, starting from highest rank
   * @param key - The name of the t-digest sketch
   * @param ranks - Array of ranks to get value estimates for (descending order)
   */
  BYREVRANK,
  /**
   * Returns value estimates for one or more ranks in a t-digest sketch, starting from highest rank
   * @param key - The name of the t-digest sketch
   * @param ranks - Array of ranks to get value estimates for (descending order)
   */
  byRevRank: BYREVRANK,
  /**
   * Estimates the cumulative distribution function for values in a t-digest sketch
   * @param key - The name of the t-digest sketch
   * @param values - Array of values to get CDF estimates for
   */
  CDF,
  /**
   * Estimates the cumulative distribution function for values in a t-digest sketch
   * @param key - The name of the t-digest sketch
   * @param values - Array of values to get CDF estimates for
   */
  cdf: CDF,
  /**
   * Creates a new t-digest sketch for storing distributions
   * @param key - The name of the t-digest sketch
   * @param options - Optional parameters for sketch creation
   * @param options.COMPRESSION - Compression parameter that affects performance and accuracy
   */
  CREATE,
  /**
   * Creates a new t-digest sketch for storing distributions
   * @param key - The name of the t-digest sketch
   * @param options - Optional parameters for sketch creation
   * @param options.COMPRESSION - Compression parameter that affects performance and accuracy
   */
  create: CREATE,
  /**
   * Returns information about a t-digest sketch including compression, capacity, nodes, weights, observations and memory usage
   * @param key - The name of the t-digest sketch to get information about
   */
  INFO,
  /**
   * Returns information about a t-digest sketch including compression, capacity, nodes, weights, observations and memory usage
   * @param key - The name of the t-digest sketch to get information about
   */
  info: INFO,
  /**
   * Returns the maximum value from a t-digest sketch
   * @param key - The name of the t-digest sketch
   */
  MAX,
  /**
   * Returns the maximum value from a t-digest sketch
   * @param key - The name of the t-digest sketch
   */
  max: MAX,
  /**
   * Merges multiple t-digest sketches into one, with optional compression and override settings
   * @param destination - The name of the destination t-digest sketch
   * @param source - One or more source sketch names to merge from
   * @param options - Optional parameters for merge operation
   * @param options.COMPRESSION - New compression value for merged sketch
   * @param options.OVERRIDE - If true, override destination sketch if it exists
   */
  MERGE,
  /**
   * Merges multiple t-digest sketches into one, with optional compression and override settings
   * @param destination - The name of the destination t-digest sketch
   * @param source - One or more source sketch names to merge from
   * @param options - Optional parameters for merge operation
   * @param options.COMPRESSION - New compression value for merged sketch
   * @param options.OVERRIDE - If true, override destination sketch if it exists
   */
  merge: MERGE,
  /**
   * Returns the minimum value from a t-digest sketch
   * @param key - The name of the t-digest sketch
   */
  MIN,
  /**
   * Returns the minimum value from a t-digest sketch
   * @param key - The name of the t-digest sketch
   */
  min: MIN,
  /**
   * Returns value estimates at requested quantiles from a t-digest sketch
   * @param key - The name of the t-digest sketch
   * @param quantiles - Array of quantiles (between 0 and 1) to get value estimates for
   */
  QUANTILE,
  /**
   * Returns value estimates at requested quantiles from a t-digest sketch
   * @param key - The name of the t-digest sketch
   * @param quantiles - Array of quantiles (between 0 and 1) to get value estimates for
   */
  quantile: QUANTILE,
  /**
   * Returns the rank of one or more values in a t-digest sketch (number of values that are lower than each value)
   * @param key - The name of the t-digest sketch
   * @param values - Array of values to get ranks for
   */
  RANK,
  /**
   * Returns the rank of one or more values in a t-digest sketch (number of values that are lower than each value)
   * @param key - The name of the t-digest sketch
   * @param values - Array of values to get ranks for
   */
  rank: RANK,
  /**
   * Resets a t-digest sketch, clearing all previously added observations
   * @param key - The name of the t-digest sketch to reset
   */
  RESET,
  /**
   * Resets a t-digest sketch, clearing all previously added observations
   * @param key - The name of the t-digest sketch to reset
   */
  reset: RESET,
  /**
   * Returns the reverse rank of one or more values in a t-digest sketch (number of values that are higher than each value)
   * @param key - The name of the t-digest sketch
   * @param values - Array of values to get reverse ranks for
   */
  REVRANK,
  /**
   * Returns the reverse rank of one or more values in a t-digest sketch (number of values that are higher than each value)
   * @param key - The name of the t-digest sketch
   * @param values - Array of values to get reverse ranks for
   */
  revRank: REVRANK,
  /**
   * Returns the mean value from a t-digest sketch after trimming values at specified percentiles
   * @param key - The name of the t-digest sketch
   * @param lowCutPercentile - Lower percentile cutoff (between 0 and 100)
   * @param highCutPercentile - Higher percentile cutoff (between 0 and 100)
   */
  TRIMMED_MEAN,
  /**
   * Returns the mean value from a t-digest sketch after trimming values at specified percentiles
   * @param key - The name of the t-digest sketch
   * @param lowCutPercentile - Lower percentile cutoff (between 0 and 100)
   * @param highCutPercentile - Higher percentile cutoff (between 0 and 100)
   */
  trimmedMean: TRIMMED_MEAN
} as const satisfies RedisCommands;
