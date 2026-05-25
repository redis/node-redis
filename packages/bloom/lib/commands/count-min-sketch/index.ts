import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';
import INCRBY from './INCRBY';
import INFO from './INFO';
import INITBYDIM from './INITBYDIM';
import INITBYPROB from './INITBYPROB';
import MERGE from './MERGE';
import QUERY from './QUERY';

export default {
  /**
   * Increases the count of one or more items in a Count-Min Sketch
   * @param key - The name of the sketch
   * @param items - A single item or array of items to increment, each with an item and increment value
   */
  INCRBY,
  /**
   * Increases the count of one or more items in a Count-Min Sketch
   * @param key - The name of the sketch
   * @param items - A single item or array of items to increment, each with an item and increment value
   */
  incrBy: INCRBY,
  /**
   * Returns width, depth, and total count of items in a Count-Min Sketch
   * @param key - The name of the sketch to get information about
   */
  INFO,
  /**
   * Returns width, depth, and total count of items in a Count-Min Sketch
   * @param key - The name of the sketch to get information about
   */
  info: INFO,
  /**
   * Initialize a Count-Min Sketch using width and depth parameters
   * @param key - The name of the sketch
   * @param width - Number of counters in each array (must be a multiple of 2)
   * @param depth - Number of counter arrays (determines accuracy of estimates)
   */
  INITBYDIM,
  /**
   * Initialize a Count-Min Sketch using width and depth parameters
   * @param key - The name of the sketch
   * @param width - Number of counters in each array (must be a multiple of 2)
   * @param depth - Number of counter arrays (determines accuracy of estimates)
   */
  initByDim: INITBYDIM,
  /**
   * Initialize a Count-Min Sketch using error rate and probability parameters
   * @param key - The name of the sketch
   * @param error - Estimate error, as a decimal between 0 and 1
   * @param probability - The desired probability for inflated count, as a decimal between 0 and 1
   */
  INITBYPROB,
  /**
   * Initialize a Count-Min Sketch using error rate and probability parameters
   * @param key - The name of the sketch
   * @param error - Estimate error, as a decimal between 0 and 1
   * @param probability - The desired probability for inflated count, as a decimal between 0 and 1
   */
  initByProb: INITBYPROB,
  /**
   * Merges multiple Count-Min Sketches into a single sketch, with optional weights
   * @param destination - The name of the destination sketch
   * @param source - Array of sketch names or array of sketches with weights
   */
  MERGE,
  /**
   * Merges multiple Count-Min Sketches into a single sketch, with optional weights
   * @param destination - The name of the destination sketch
   * @param source - Array of sketch names or array of sketches with weights
   */
  merge: MERGE,
  /**
   * Returns the count for one or more items in a Count-Min Sketch
   * @param key - The name of the sketch
   * @param items - One or more items to get counts for
   */
  QUERY,
  /**
   * Returns the count for one or more items in a Count-Min Sketch
   * @param key - The name of the sketch
   * @param items - One or more items to get counts for
   */
  query: QUERY
} as const satisfies RedisCommands;
