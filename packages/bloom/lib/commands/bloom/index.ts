import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';

import ADD from './ADD';
import CARD from './CARD';
import EXISTS from './EXISTS';
import INFO from './INFO';
import INSERT from './INSERT';
import LOADCHUNK from './LOADCHUNK';
import MADD from './MADD';
import MEXISTS from './MEXISTS';
import RESERVE from './RESERVE';
import SCANDUMP from './SCANDUMP';

export * from './helpers';

export default {
  /**
   * Adds an item to a Bloom Filter
   * @param key - The name of the Bloom filter
   * @param item - The item to add to the filter
   */
  ADD,
  /**
   * Adds an item to a Bloom Filter
   * @param key - The name of the Bloom filter
   * @param item - The item to add to the filter
   */
  add: ADD,
  /**
   * Returns the cardinality (number of items) in a Bloom Filter
   * @param key - The name of the Bloom filter to query
   */
  CARD,
  /**
   * Returns the cardinality (number of items) in a Bloom Filter
   * @param key - The name of the Bloom filter to query
   */
  card: CARD,
  /**
   * Checks if an item exists in a Bloom Filter
   * @param key - The name of the Bloom filter
   * @param item - The item to check for existence
   */
  EXISTS,
  /**
   * Checks if an item exists in a Bloom Filter
   * @param key - The name of the Bloom filter
   * @param item - The item to check for existence
   */
  exists: EXISTS,
  /**
   * Returns information about a Bloom Filter, including capacity, size, number of filters, items inserted, and expansion rate
   * @param key - The name of the Bloom filter to get information about
   */
  INFO,
  /**
   * Returns information about a Bloom Filter, including capacity, size, number of filters, items inserted, and expansion rate
   * @param key - The name of the Bloom filter to get information about
   */
  info: INFO,
  /**
   * Adds one or more items to a Bloom Filter, creating it if it does not exist
   * @param key - The name of the Bloom filter
   * @param items - One or more items to add to the filter
   * @param options - Optional parameters for filter creation
   * @param options.CAPACITY - Desired capacity for a new filter
   * @param options.ERROR - Desired error rate for a new filter
   * @param options.EXPANSION - Expansion rate for a new filter
   * @param options.NOCREATE - If true, prevents automatic filter creation
   * @param options.NONSCALING - Prevents the filter from creating additional sub-filters
   */
  INSERT,
  /**
   * Adds one or more items to a Bloom Filter, creating it if it does not exist
   * @param key - The name of the Bloom filter
   * @param items - One or more items to add to the filter
   * @param options - Optional parameters for filter creation
   * @param options.CAPACITY - Desired capacity for a new filter
   * @param options.ERROR - Desired error rate for a new filter
   * @param options.EXPANSION - Expansion rate for a new filter
   * @param options.NOCREATE - If true, prevents automatic filter creation
   * @param options.NONSCALING - Prevents the filter from creating additional sub-filters
   */
  insert: INSERT,
  /**
   * Restores a Bloom Filter chunk previously saved using SCANDUMP
   * @param key - The name of the Bloom filter to restore
   * @param iterator - Iterator value from the SCANDUMP command
   * @param chunk - Data chunk from the SCANDUMP command
   */
  LOADCHUNK,
  /**
   * Restores a Bloom Filter chunk previously saved using SCANDUMP
   * @param key - The name of the Bloom filter to restore
   * @param iterator - Iterator value from the SCANDUMP command
   * @param chunk - Data chunk from the SCANDUMP command
   */
  loadChunk: LOADCHUNK,
  /**
   * Adds multiple items to a Bloom Filter in a single call
   * @param key - The name of the Bloom filter
   * @param items - One or more items to add to the filter
   */
  MADD,
  /**
   * Adds multiple items to a Bloom Filter in a single call
   * @param key - The name of the Bloom filter
   * @param items - One or more items to add to the filter
   */
  mAdd: MADD,
  /**
   * Checks if multiple items exist in a Bloom Filter in a single call
   * @param key - The name of the Bloom filter
   * @param items - One or more items to check for existence
   */
  MEXISTS,
  /**
   * Checks if multiple items exist in a Bloom Filter in a single call
   * @param key - The name of the Bloom filter
   * @param items - One or more items to check for existence
   */
  mExists: MEXISTS,
  /**
   * Creates an empty Bloom Filter with a given desired error ratio and initial capacity
   * @param key - The name of the Bloom filter to create
   * @param errorRate - The desired probability for false positives (between 0 and 1)
   * @param capacity - The number of entries intended to be added to the filter
   * @param options - Optional parameters to tune the filter
   * @param options.EXPANSION - Expansion rate for the filter
   * @param options.NONSCALING - Prevents the filter from creating additional sub-filters
   */
  RESERVE,
  /**
   * Creates an empty Bloom Filter with a given desired error ratio and initial capacity
   * @param key - The name of the Bloom filter to create
   * @param errorRate - The desired probability for false positives (between 0 and 1)
   * @param capacity - The number of entries intended to be added to the filter
   * @param options - Optional parameters to tune the filter
   * @param options.EXPANSION - Expansion rate for the filter
   * @param options.NONSCALING - Prevents the filter from creating additional sub-filters
   */
  reserve: RESERVE,
  /**
   * Begins an incremental save of a Bloom Filter. This is useful for large filters that can't be saved at once
   * @param key - The name of the Bloom filter to save
   * @param iterator - Iterator value; Start at 0, and use the iterator from the response for the next chunk
   */
  SCANDUMP,
  /**
   * Begins an incremental save of a Bloom Filter. This is useful for large filters that can't be saved at once
   * @param key - The name of the Bloom filter to save
   * @param iterator - Iterator value; Start at 0, and use the iterator from the response for the next chunk
   */
  scanDump: SCANDUMP
} as const satisfies RedisCommands;
