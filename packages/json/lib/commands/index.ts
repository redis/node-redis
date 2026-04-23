import ARRAPPEND from './ARRAPPEND';
import ARRINDEX from './ARRINDEX';
import ARRINSERT from './ARRINSERT';
import ARRLEN from './ARRLEN';
import ARRPOP from './ARRPOP';
import ARRTRIM from './ARRTRIM';
import CLEAR from './CLEAR';
import DEBUG_MEMORY from './DEBUG_MEMORY';
import DEL from './DEL';
import FORGET from './FORGET';
import GET from './GET';
import MERGE from './MERGE';
import MGET from './MGET';
import MSET from './MSET';
import NUMINCRBY from './NUMINCRBY';
import NUMMULTBY from './NUMMULTBY';
import OBJKEYS from './OBJKEYS';
import OBJLEN from './OBJLEN';
// import RESP from './RESP';
import SET from './SET';
import STRAPPEND from './STRAPPEND';
import STRLEN from './STRLEN';
import TOGGLE from './TOGGLE';
import TYPE from './TYPE';

// Re-export helper types and functions from client package
export type { RedisJSON } from '@redis/client/dist/lib/commands/generic-transformers';
export { transformRedisJsonArgument, transformRedisJsonReply, transformRedisJsonNullReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  /**
   * Appends one or more values to the end of an array in a JSON document.
   * Returns the new array length after append, or null if the path does not exist.
   *
   * @param key - The key to append to
   * @param path - Path to the array in the JSON document
   * @param json - The first value to append
   * @param jsons - Additional values to append
   */
  ARRAPPEND,
  /**
   * Appends one or more values to the end of an array in a JSON document.
   * Returns the new array length after append, or null if the path does not exist.
   *
   * @param key - The key to append to
   * @param path - Path to the array in the JSON document
   * @param json - The first value to append
   * @param jsons - Additional values to append
   */
  arrAppend: ARRAPPEND,
  /**
   * Returns the index of the first occurrence of a value in a JSON array.
   * If the specified value is not found, it returns -1, or null if the path does not exist.
   *
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param json - The value to search for
   * @param options - Optional range parameters for the search
   * @param options.range.start - Starting index for the search
   * @param options.range.stop - Optional ending index for the search
   */
  ARRINDEX,
  /**
   * Returns the index of the first occurrence of a value in a JSON array.
   * If the specified value is not found, it returns -1, or null if the path does not exist.
   *
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param json - The value to search for
   * @param options - Optional range parameters for the search
   * @param options.range.start - Starting index for the search
   * @param options.range.stop - Optional ending index for the search
   */
  arrIndex: ARRINDEX,
  /**
   * Inserts one or more values into an array at the specified index.
   * Returns the new array length after insert, or null if the path does not exist.
   *
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param index - The position where to insert the values
   * @param json - The first value to insert
   * @param jsons - Additional values to insert
   */
  ARRINSERT,
  /**
   * Inserts one or more values into an array at the specified index.
   * Returns the new array length after insert, or null if the path does not exist.
   *
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param index - The position where to insert the values
   * @param json - The first value to insert
   * @param jsons - Additional values to insert
   */
  arrInsert: ARRINSERT,
  /**
   * Returns the length of an array in a JSON document.
   * Returns null if the path does not exist or the value is not an array.
   *
   * @param key - The key containing the array
   * @param options - Optional parameters
   * @param options.path - Path to the array in the JSON document
   */
  ARRLEN,
  /**
   * Returns the length of an array in a JSON document.
   * Returns null if the path does not exist or the value is not an array.
   *
   * @param key - The key containing the array
   * @param options - Optional parameters
   * @param options.path - Path to the array in the JSON document
   */
  arrLen: ARRLEN,
  /**
   * Removes and returns an element from an array in a JSON document.
   * Returns null if the path does not exist or the value is not an array.
   *
   * @param key - The key containing the array
   * @param options - Optional parameters
   * @param options.path - Path to the array in the JSON document
   * @param options.index - Optional index to pop from. Default is -1 (last element)
   */
  ARRPOP,
  /**
   * Removes and returns an element from an array in a JSON document.
   * Returns null if the path does not exist or the value is not an array.
   *
   * @param key - The key containing the array
   * @param options - Optional parameters
   * @param options.path - Path to the array in the JSON document
   * @param options.index - Optional index to pop from. Default is -1 (last element)
   */
  arrPop: ARRPOP,
  /**
   * Trims an array in a JSON document to include only elements within the specified range.
   * Returns the new array length after trimming, or null if the path does not exist.
   *
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param start - Starting index (inclusive)
   * @param stop - Ending index (inclusive)
   */
  ARRTRIM,
  /**
   * Trims an array in a JSON document to include only elements within the specified range.
   * Returns the new array length after trimming, or null if the path does not exist.
   *
   * @param key - The key containing the array
   * @param path - Path to the array in the JSON document
   * @param start - Starting index (inclusive)
   * @param stop - Ending index (inclusive)
   */
  arrTrim: ARRTRIM,
  /**
   * Clears container values (arrays/objects) in a JSON document.
   * Returns the number of values cleared (0 or 1), or null if the path does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the container to clear
   */
  CLEAR,
  /**
   * Clears container values (arrays/objects) in a JSON document.
   * Returns the number of values cleared (0 or 1), or null if the path does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the container to clear
   */
  clear: CLEAR,
  /**
   * Reports memory usage details for a JSON document value.
   * Returns size in bytes of the value, or null if the key or path does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the value to examine
   */
  DEBUG_MEMORY,
  /**
   * Reports memory usage details for a JSON document value.
   * Returns size in bytes of the value, or null if the key or path does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the value to examine
   */
  debugMemory: DEBUG_MEMORY,
  /**
   * Deletes a value from a JSON document.
   * Returns the number of paths deleted (0 or 1), or null if the key does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the value to delete
   */
  DEL,
  /**
   * Deletes a value from a JSON document.
   * Returns the number of paths deleted (0 or 1), or null if the key does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the value to delete
   */
  del: DEL,
  /**
   * Alias for JSON.DEL - Deletes a value from a JSON document.
   * Returns the number of paths deleted (0 or 1), or null if the key does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the value to delete
   */
  FORGET,
  /**
   * Alias for JSON.DEL - Deletes a value from a JSON document.
   * Returns the number of paths deleted (0 or 1), or null if the key does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the value to delete
   */
  forget: FORGET,
  /**
   * Gets values from a JSON document.
   * Returns the value at the specified path, or null if the key or path does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path(s) to the value(s) to retrieve
   */
  GET,
  /**
   * Gets values from a JSON document.
   * Returns the value at the specified path, or null if the key or path does not exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path(s) to the value(s) to retrieve
   */
  get: GET,
  /**
   * Merges a given JSON value into a JSON document.
   * Returns OK on success, or null if the key does not exist.
   *
   * @param key - The key containing the JSON document
   * @param path - Path to merge into
   * @param value - JSON value to merge
   */
  MERGE,
  /**
   * Merges a given JSON value into a JSON document.
   * Returns OK on success, or null if the key does not exist.
   *
   * @param key - The key containing the JSON document
   * @param path - Path to merge into
   * @param value - JSON value to merge
   */
  merge: MERGE,
  /**
   * Gets values at a specific path from multiple JSON documents.
   * Returns an array of values at the path from each key, null for missing keys/paths.
   *
   * @param keys - Array of keys containing JSON documents
   * @param path - Path to retrieve from each document
   */
  MGET,
  /**
   * Gets values at a specific path from multiple JSON documents.
   * Returns an array of values at the path from each key, null for missing keys/paths.
   *
   * @param keys - Array of keys containing JSON documents
   * @param path - Path to retrieve from each document
   */
  mGet: MGET,
  /**
   * Sets multiple JSON values in multiple documents.
   * Returns OK on success.
   *
   * @param items - Array of objects containing key, path, and value to set
   * @param items[].key - The key containing the JSON document
   * @param items[].path - Path in the document to set
   * @param items[].value - JSON value to set at the path
   */
  MSET,
  /**
   * Sets multiple JSON values in multiple documents.
   * Returns OK on success.
   *
   * @param items - Array of objects containing key, path, and value to set
   * @param items[].key - The key containing the JSON document
   * @param items[].path - Path in the document to set
   * @param items[].value - JSON value to set at the path
   */
  mSet: MSET,
  /**
   * Increments a numeric value stored in a JSON document by a given number.
   * Returns the value after increment, or null if the key/path doesn't exist or value is not numeric.
   *
   * @param key - The key containing the JSON document
   * @param path - Path to the numeric value
   * @param by - Amount to increment by
   */
  NUMINCRBY,
  /**
   * Increments a numeric value stored in a JSON document by a given number.
   * Returns the value after increment, or null if the key/path doesn't exist or value is not numeric.
   *
   * @param key - The key containing the JSON document
   * @param path - Path to the numeric value
   * @param by - Amount to increment by
   */
  numIncrBy: NUMINCRBY,
  /**
   * Multiplies a numeric value stored in a JSON document by a given number.
   * Returns the value after multiplication, or null if the key/path doesn't exist or value is not numeric.
   *
   * @param key - The key containing the JSON document
   * @param path - Path to the numeric value
   * @param by - Amount to multiply by
   */
  NUMMULTBY,
  /**
   * Multiplies a numeric value stored in a JSON document by a given number.
   * Returns the value after multiplication, or null if the key/path doesn't exist or value is not numeric.
   *
   * @param key - The key containing the JSON document
   * @param path - Path to the numeric value
   * @param by - Amount to multiply by
   */
  numMultBy: NUMMULTBY,
  /**
   * Returns the keys in the object stored in a JSON document.
   * Returns array of keys, array of arrays for multiple paths, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the object to examine
   */
  OBJKEYS,
  /**
   * Returns the keys in the object stored in a JSON document.
   * Returns array of keys, array of arrays for multiple paths, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the object to examine
   */
  objKeys: OBJKEYS,
  /**
   * Returns the number of keys in the object stored in a JSON document.
   * Returns length of object, array of lengths for multiple paths, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the object to examine
   */
  OBJLEN,
  /**
   * Returns the number of keys in the object stored in a JSON document.
   * Returns length of object, array of lengths for multiple paths, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the object to examine
   */
  objLen: OBJLEN,
  // RESP,
  // resp: RESP,
  /**
   * Sets a JSON value at a specific path in a JSON document.
   * Returns OK on success, or null if condition (NX/XX) is not met.
   *
   * @param key - The key containing the JSON document
   * @param path - Path in the document to set
   * @param json - JSON value to set at the path
   * @param options - Optional parameters
   * @param options.condition - Set condition: NX (only if doesn't exist) or XX (only if exists)
   * @deprecated options.NX - Use options.condition instead
   * @deprecated options.XX - Use options.condition instead
   */
  SET,
  /**
   * Sets a JSON value at a specific path in a JSON document.
   * Returns OK on success, or null if condition (NX/XX) is not met.
   *
   * @param key - The key containing the JSON document
   * @param path - Path in the document to set
   * @param json - JSON value to set at the path
   * @param options - Optional parameters
   * @param options.condition - Set condition: NX (only if doesn't exist) or XX (only if exists)
   * @deprecated options.NX - Use options.condition instead
   * @deprecated options.XX - Use options.condition instead
   */
  set: SET,
  /**
   * Appends a string to a string value stored in a JSON document.
   * Returns new string length after append, or null if the path doesn't exist or value is not a string.
   *
   * @param key - The key containing the JSON document
   * @param append - String to append
   * @param options - Optional parameters
   * @param options.path - Path to the string value
   */
  STRAPPEND,
  /**
   * Appends a string to a string value stored in a JSON document.
   * Returns new string length after append, or null if the path doesn't exist or value is not a string.
   *
   * @param key - The key containing the JSON document
   * @param append - String to append
   * @param options - Optional parameters
   * @param options.path - Path to the string value
   */
  strAppend: STRAPPEND,
  /**
   * Returns the length of a string value stored in a JSON document.
   * Returns string length, array of lengths for multiple paths, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the string value
   */
  STRLEN,
  /**
   * Returns the length of a string value stored in a JSON document.
   * Returns string length, array of lengths for multiple paths, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to the string value
   */
  strLen: STRLEN,
  /**
   * Toggles a boolean value stored in a JSON document.
   * Returns 1 if value was toggled to true, 0 if toggled to false, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param path - Path to the boolean value
   */
  TOGGLE,
  /**
   * Toggles a boolean value stored in a JSON document.
   * Returns 1 if value was toggled to true, 0 if toggled to false, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param path - Path to the boolean value
   */
  toggle: TOGGLE,
  /**
   * Returns the type of JSON value at a specific path in a JSON document.
   * Returns the type as a string, array of types for multiple paths, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to examine
   */
  TYPE,
  /**
   * Returns the type of JSON value at a specific path in a JSON document.
   * Returns the type as a string, array of types for multiple paths, or null if path doesn't exist.
   *
   * @param key - The key containing the JSON document
   * @param options - Optional parameters
   * @param options.path - Path to examine
   */
  type: TYPE
};
