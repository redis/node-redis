import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';
import ADD from './ADD';
import COUNT from './COUNT';
import INCRBY from './INCRBY';
import INFO from './INFO';
import LIST_WITHCOUNT from './LIST_WITHCOUNT';
import LIST from './LIST';
import QUERY from './QUERY';
import RESERVE from './RESERVE';

export default {
  /**
   * Adds one or more items to a Top-K filter and returns items dropped from the top-K list
   * @param key - The name of the Top-K filter
   * @param items - One or more items to add to the filter
   */
  ADD,
  /**
   * Adds one or more items to a Top-K filter and returns items dropped from the top-K list
   * @param key - The name of the Top-K filter
   * @param items - One or more items to add to the filter
   */
  add: ADD,
  /**
   * Returns the count of occurrences for one or more items in a Top-K filter
   * @param key - The name of the Top-K filter
   * @param items - One or more items to get counts for
   */
  COUNT,
  /**
   * Returns the count of occurrences for one or more items in a Top-K filter
   * @param key - The name of the Top-K filter
   * @param items - One or more items to get counts for
   */
  count: COUNT,
  /**
   * Increases the score of one or more items in a Top-K filter by specified increments
   * @param key - The name of the Top-K filter
   * @param items - A single item or array of items to increment, each with an item name and increment value
   */
  INCRBY,
  /**
   * Increases the score of one or more items in a Top-K filter by specified increments
   * @param key - The name of the Top-K filter
   * @param items - A single item or array of items to increment, each with an item name and increment value
   */
  incrBy: INCRBY,
  /**
   * Returns configuration and statistics of a Top-K filter, including k, width, depth, and decay parameters
   * @param key - The name of the Top-K filter to get information about
   */
  INFO,
  /**
   * Returns configuration and statistics of a Top-K filter, including k, width, depth, and decay parameters
   * @param key - The name of the Top-K filter to get information about
   */
  info: INFO,
  /**
   * Returns all items in a Top-K filter with their respective counts
   * @param key - The name of the Top-K filter
   */
  LIST_WITHCOUNT,
  /**
   * Returns all items in a Top-K filter with their respective counts
   * @param key - The name of the Top-K filter
   */
  listWithCount: LIST_WITHCOUNT,
  /**
   * Returns all items in a Top-K filter
   * @param key - The name of the Top-K filter
   */
  LIST,
  /**
   * Returns all items in a Top-K filter
   * @param key - The name of the Top-K filter
   */
  list: LIST,
  /**
   * Checks if one or more items are in the Top-K list
   * @param key - The name of the Top-K filter
   * @param items - One or more items to check in the filter
   */
  QUERY,
  /**
   * Checks if one or more items are in the Top-K list
   * @param key - The name of the Top-K filter
   * @param items - One or more items to check in the filter
   */
  query: QUERY,
  /**
   * Creates a new Top-K filter with specified parameters
   * @param key - The name of the Top-K filter
   * @param topK - Number of top occurring items to keep
   * @param options - Optional parameters for filter configuration
   * @param options.width - Number of counters in each array
   * @param options.depth - Number of counter-arrays
   * @param options.decay - Counter decay factor
   */
  RESERVE,
  /**
   * Creates a new Top-K filter with specified parameters
   * @param key - The name of the Top-K filter
   * @param topK - Number of top occurring items to keep
   * @param options - Optional parameters for filter configuration
   * @param options.width - Number of counters in each array
   * @param options.depth - Number of counter-arrays
   * @param options.decay - Counter decay factor
   */
  reserve: RESERVE
} as const satisfies RedisCommands;
