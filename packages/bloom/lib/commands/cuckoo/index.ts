import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';
import ADD from './ADD';
import ADDNX from './ADDNX';
import COUNT from './COUNT';
import DEL from './DEL';
import EXISTS from './EXISTS';
import INFO from './INFO';
import INSERT from './INSERT';
import INSERTNX from './INSERTNX';
import LOADCHUNK from './LOADCHUNK';
import RESERVE from './RESERVE';
import SCANDUMP from './SCANDUMP';

export default {
  /**
   * Adds an item to a Cuckoo Filter, creating the filter if it does not exist
   * @param key - The name of the Cuckoo filter
   * @param item - The item to add to the filter
   */
  ADD,
  /**
   * Adds an item to a Cuckoo Filter, creating the filter if it does not exist
   * @param key - The name of the Cuckoo filter
   * @param item - The item to add to the filter
   */
  add: ADD,
  /**
   * Adds an item to a Cuckoo Filter only if it does not exist
   * @param key - The name of the Cuckoo filter
   * @param item - The item to add to the filter if it doesn't exist
   */
  ADDNX,
  /**
   * Adds an item to a Cuckoo Filter only if it does not exist
   * @param key - The name of the Cuckoo filter
   * @param item - The item to add to the filter if it doesn't exist
   */
  addNX: ADDNX,
  /**
   * Returns the number of times an item appears in a Cuckoo Filter
   * @param key - The name of the Cuckoo filter
   * @param item - The item to count occurrences of
   */
  COUNT,
  /**
   * Returns the number of times an item appears in a Cuckoo Filter
   * @param key - The name of the Cuckoo filter
   * @param item - The item to count occurrences of
   */
  count: COUNT,
  /**
   * Removes an item from a Cuckoo Filter if it exists
   * @param key - The name of the Cuckoo filter
   * @param item - The item to remove from the filter
   */
  DEL,
  /**
   * Removes an item from a Cuckoo Filter if it exists
   * @param key - The name of the Cuckoo filter
   * @param item - The item to remove from the filter
   */
  del: DEL,
  /**
   * Checks if an item exists in a Cuckoo Filter
   * @param key - The name of the Cuckoo filter
   * @param item - The item to check for existence
   */
  EXISTS,
  /**
   * Checks if an item exists in a Cuckoo Filter
   * @param key - The name of the Cuckoo filter
   * @param item - The item to check for existence
   */
  exists: EXISTS,
  /**
   * Returns detailed information about a Cuckoo Filter including size, buckets, filters count, items statistics and configuration
   * @param key - The name of the Cuckoo filter to get information about
   */
  INFO,
  /**
   * Returns detailed information about a Cuckoo Filter including size, buckets, filters count, items statistics and configuration
   * @param key - The name of the Cuckoo filter to get information about
   */
  info: INFO,
  /**
   * Adds one or more items to a Cuckoo Filter, creating it if it does not exist
   * @param key - The name of the Cuckoo filter
   * @param items - One or more items to add to the filter
   * @param options - Optional parameters for filter creation
   * @param options.CAPACITY - The number of entries intended to be added to the filter
   * @param options.NOCREATE - If true, prevents automatic filter creation
   */
  INSERT,
  /**
   * Adds one or more items to a Cuckoo Filter, creating it if it does not exist
   * @param key - The name of the Cuckoo filter
   * @param items - One or more items to add to the filter
   * @param options - Optional parameters for filter creation
   * @param options.CAPACITY - The number of entries intended to be added to the filter
   * @param options.NOCREATE - If true, prevents automatic filter creation
   */
  insert: INSERT,
  /**
   * Adds one or more items to a Cuckoo Filter only if they do not exist yet, creating the filter if needed
   * @param key - The name of the Cuckoo filter
   * @param items - One or more items to add to the filter
   * @param options - Optional parameters for filter creation
   * @param options.CAPACITY - The number of entries intended to be added to the filter
   * @param options.NOCREATE - If true, prevents automatic filter creation
   */
  INSERTNX,
  /**
   * Adds one or more items to a Cuckoo Filter only if they do not exist yet, creating the filter if needed
   * @param key - The name of the Cuckoo filter
   * @param items - One or more items to add to the filter
   * @param options - Optional parameters for filter creation
   * @param options.CAPACITY - The number of entries intended to be added to the filter
   * @param options.NOCREATE - If true, prevents automatic filter creation
   */
  insertNX: INSERTNX,
  /**
   * Restores a Cuckoo Filter chunk previously saved using SCANDUMP
   * @param key - The name of the Cuckoo filter to restore
   * @param iterator - Iterator value from the SCANDUMP command
   * @param chunk - Data chunk from the SCANDUMP command
   */
  LOADCHUNK,
  /**
   * Restores a Cuckoo Filter chunk previously saved using SCANDUMP
   * @param key - The name of the Cuckoo filter to restore
   * @param iterator - Iterator value from the SCANDUMP command
   * @param chunk - Data chunk from the SCANDUMP command
   */
  loadChunk: LOADCHUNK,
  /**
   * Creates an empty Cuckoo Filter with specified capacity and parameters
   * @param key - The name of the Cuckoo filter to create
   * @param capacity - The number of entries intended to be added to the filter
   * @param options - Optional parameters to tune the filter
   * @param options.BUCKETSIZE - Number of items in each bucket
   * @param options.MAXITERATIONS - Maximum number of iterations before declaring filter full
   * @param options.EXPANSION - Number of additional buckets per expansion
   */
  RESERVE,
  /**
   * Creates an empty Cuckoo Filter with specified capacity and parameters
   * @param key - The name of the Cuckoo filter to create
   * @param capacity - The number of entries intended to be added to the filter
   * @param options - Optional parameters to tune the filter
   * @param options.BUCKETSIZE - Number of items in each bucket
   * @param options.MAXITERATIONS - Maximum number of iterations before declaring filter full
   * @param options.EXPANSION - Number of additional buckets per expansion
   */
  reserve: RESERVE,
  /**
   * Begins an incremental save of a Cuckoo Filter. This is useful for large filters that can't be saved at once
   * @param key - The name of the Cuckoo filter to save
   * @param iterator - Iterator value; Start at 0, and use the iterator from the response for the next chunk
   */
  SCANDUMP,
  /**
   * Begins an incremental save of a Cuckoo Filter. This is useful for large filters that can't be saved at once
   * @param key - The name of the Cuckoo filter to save
   * @param iterator - Iterator value; Start at 0, and use the iterator from the response for the next chunk
   */
  scanDump: SCANDUMP
} as const satisfies RedisCommands;
