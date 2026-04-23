import _LIST from './_LIST';
import ALTER from './ALTER';
import AGGREGATE_WITHCURSOR from './AGGREGATE_WITHCURSOR';
import AGGREGATE from './AGGREGATE';
import ALIASADD from './ALIASADD';
import ALIASDEL from './ALIASDEL';
import ALIASUPDATE from './ALIASUPDATE';
import CONFIG_GET from './CONFIG_GET';
import CONFIG_SET from './CONFIG_SET';
import CREATE from './CREATE';
import CURSOR_DEL from './CURSOR_DEL';
import CURSOR_READ from './CURSOR_READ';
import DICTADD from './DICTADD';
import DICTDEL from './DICTDEL';
import DICTDUMP from './DICTDUMP';
import DROPINDEX from './DROPINDEX';
import EXPLAIN from './EXPLAIN';
import EXPLAINCLI from './EXPLAINCLI';
import HYBRID from './HYBRID';
import INFO from './INFO';
import PROFILESEARCH from './PROFILE_SEARCH';
import PROFILEAGGREGATE from './PROFILE_AGGREGATE';
import SEARCH_NOCONTENT from './SEARCH_NOCONTENT';
import SEARCH from './SEARCH';
import SPELLCHECK from './SPELLCHECK';
import SUGADD from './SUGADD';
import SUGDEL from './SUGDEL';
import SUGGET_WITHPAYLOADS from './SUGGET_WITHPAYLOADS';
import SUGGET_WITHSCORES_WITHPAYLOADS from './SUGGET_WITHSCORES_WITHPAYLOADS';
import SUGGET_WITHSCORES from './SUGGET_WITHSCORES';
import SUGGET from './SUGGET';
import SUGLEN from './SUGLEN';
import SYNDUMP from './SYNDUMP';
import SYNUPDATE from './SYNUPDATE';
import TAGVALS from './TAGVALS';

export default {
  /**
   * Lists all existing indexes in the database.
   */
  _LIST,
  /**
   * Lists all existing indexes in the database.
   */
  _list: _LIST,
  /**
   * Alters an existing RediSearch index schema by adding new fields.
   * @param index - The index to alter
   * @param schema - The schema definition containing new fields to add
   */
  ALTER,
  /**
   * Alters an existing RediSearch index schema by adding new fields.
   * @param index - The index to alter
   * @param schema - The schema definition containing new fields to add
   */
  alter: ALTER,
  /**
   * Performs an aggregation with a cursor for retrieving large result sets.
   * @param index - Name of the index to query
   * @param query - The aggregation query
   * @param options - Optional parameters:
   *   - All options supported by FT.AGGREGATE
   *   - COUNT: Number of results to return per cursor fetch
   *   - MAXIDLE: Maximum idle time for cursor in milliseconds
   */
  AGGREGATE_WITHCURSOR,
  /**
   * Performs an aggregation with a cursor for retrieving large result sets.
   * @param index - Name of the index to query
   * @param query - The aggregation query
   * @param options - Optional parameters:
   *   - All options supported by FT.AGGREGATE
   *   - COUNT: Number of results to return per cursor fetch
   *   - MAXIDLE: Maximum idle time for cursor in milliseconds
   */
  aggregateWithCursor: AGGREGATE_WITHCURSOR,
  /**
   * Performs an aggregation query on a RediSearch index.
   * @param index - The index name to query
   * @param query - The text query to use as filter, use * to indicate no filtering
   * @param options - Optional parameters for aggregation:
   *   - VERBATIM: disable stemming in query evaluation
   *   - LOAD: specify fields to load from documents
   *   - STEPS: sequence of aggregation steps (GROUPBY, SORTBY, APPLY, LIMIT, FILTER)
   *   - PARAMS: bind parameters for query evaluation
   *   - TIMEOUT: maximum time to run the query
   */
  AGGREGATE,
  /**
   * Performs an aggregation query on a RediSearch index.
   * @param index - The index name to query
   * @param query - The text query to use as filter, use * to indicate no filtering
   * @param options - Optional parameters for aggregation:
   *   - VERBATIM: disable stemming in query evaluation
   *   - LOAD: specify fields to load from documents
   *   - STEPS: sequence of aggregation steps (GROUPBY, SORTBY, APPLY, LIMIT, FILTER)
   *   - PARAMS: bind parameters for query evaluation
   *   - TIMEOUT: maximum time to run the query
   */
  aggregate: AGGREGATE,
  /**
   * Adds an alias to a RediSearch index.
   * @param alias - The alias to add
   * @param index - The index name to alias
   */
  ALIASADD,
  /**
   * Adds an alias to a RediSearch index.
   * @param alias - The alias to add
   * @param index - The index name to alias
   */
  aliasAdd: ALIASADD,
  /**
   * Removes an existing alias from a RediSearch index.
   * @param alias - The alias to remove
   */
  ALIASDEL,
  /**
   * Removes an existing alias from a RediSearch index.
   * @param alias - The alias to remove
   */
  aliasDel: ALIASDEL,
  /**
   * Updates the index pointed to by an existing alias.
   * @param alias - The existing alias to update
   * @param index - The new index name that the alias should point to
   */
  ALIASUPDATE,
  /**
   * Updates the index pointed to by an existing alias.
   * @param alias - The existing alias to update
   * @param index - The new index name that the alias should point to
   */
  aliasUpdate: ALIASUPDATE,
  /**
   * Gets a RediSearch configuration option value.
   * @param option - The name of the configuration option to retrieve
   */
  CONFIG_GET,
  /**
   * Gets a RediSearch configuration option value.
   * @param option - The name of the configuration option to retrieve
   */
  configGet: CONFIG_GET,
  /**
   * Sets a RediSearch configuration option value.
   * @param property - The name of the configuration option to set
   * @param value - The value to set for the configuration option
   */
  CONFIG_SET,
  /**
   * Sets a RediSearch configuration option value.
   * @param property - The name of the configuration option to set
   * @param value - The value to set for the configuration option
   */
  configSet: CONFIG_SET,
  /**
   * Creates a new search index with the given schema and options.
   * @param index - Name of the index to create
   * @param schema - Index schema defining field names and types (TEXT, NUMERIC, GEO, TAG, VECTOR, GEOSHAPE).
   *   Each field can be a single definition or an array to index the same field multiple times with different configurations.
   * @param options - Optional parameters:
   *   - ON: Type of container to index (HASH or JSON)
   *   - PREFIX: Prefixes for document keys to index
   *   - FILTER: Expression that filters indexed documents
   *   - LANGUAGE/LANGUAGE_FIELD: Default language for indexing
   *   - SCORE/SCORE_FIELD: Document ranking parameters
   *   - MAXTEXTFIELDS: Index all text fields without specifying them
   *   - TEMPORARY: Create a temporary index
   *   - NOOFFSETS/NOHL/NOFIELDS/NOFREQS: Index optimization flags
   *   - STOPWORDS: Custom stopword list
   */
  CREATE,
  /**
   * Creates a new search index with the given schema and options.
   * @param index - Name of the index to create
   * @param schema - Index schema defining field names and types (TEXT, NUMERIC, GEO, TAG, VECTOR, GEOSHAPE).
   *   Each field can be a single definition or an array to index the same field multiple times with different configurations.
   * @param options - Optional parameters:
   *   - ON: Type of container to index (HASH or JSON)
   *   - PREFIX: Prefixes for document keys to index
   *   - FILTER: Expression that filters indexed documents
   *   - LANGUAGE/LANGUAGE_FIELD: Default language for indexing
   *   - SCORE/SCORE_FIELD: Document ranking parameters
   *   - MAXTEXTFIELDS: Index all text fields without specifying them
   *   - TEMPORARY: Create a temporary index
   *   - NOOFFSETS/NOHL/NOFIELDS/NOFREQS: Index optimization flags
   *   - STOPWORDS: Custom stopword list
   */
  create: CREATE,
  /**
   * Deletes a cursor from an index.
   * @param index - The index name that contains the cursor
   * @param cursorId - The cursor ID to delete
   */
  CURSOR_DEL,
  /**
   * Deletes a cursor from an index.
   * @param index - The index name that contains the cursor
   * @param cursorId - The cursor ID to delete
   */
  cursorDel: CURSOR_DEL,
  /**
   * Reads from an existing cursor to get more results from an index.
   * @param index - The index name that contains the cursor
   * @param cursor - The cursor ID to read from
   * @param options - Optional parameters:
   *   - COUNT: Maximum number of results to return
   */
  CURSOR_READ,
  /**
   * Reads from an existing cursor to get more results from an index.
   * @param index - The index name that contains the cursor
   * @param cursor - The cursor ID to read from
   * @param options - Optional parameters:
   *   - COUNT: Maximum number of results to return
   */
  cursorRead: CURSOR_READ,
  /**
   * Adds terms to a dictionary.
   * @param dictionary - Name of the dictionary to add terms to
   * @param term - One or more terms to add to the dictionary
   */
  DICTADD,
  /**
   * Adds terms to a dictionary.
   * @param dictionary - Name of the dictionary to add terms to
   * @param term - One or more terms to add to the dictionary
   */
  dictAdd: DICTADD,
  /**
   * Deletes terms from a dictionary.
   * @param dictionary - Name of the dictionary to remove terms from
   * @param term - One or more terms to delete from the dictionary
   */
  DICTDEL,
  /**
   * Deletes terms from a dictionary.
   * @param dictionary - Name of the dictionary to remove terms from
   * @param term - One or more terms to delete from the dictionary
   */
  dictDel: DICTDEL,
  /**
   * Returns all terms in a dictionary.
   * @param dictionary - Name of the dictionary to dump
   */
  DICTDUMP,
  /**
   * Returns all terms in a dictionary.
   * @param dictionary - Name of the dictionary to dump
   */
  dictDump: DICTDUMP,
  /**
   * Deletes an index and all associated documents.
   * @param index - Name of the index to delete
   * @param options - Optional parameters:
   *   - DD: Also delete the indexed documents themselves
   */
  DROPINDEX,
  /**
   * Deletes an index and all associated documents.
   * @param index - Name of the index to delete
   * @param options - Optional parameters:
   *   - DD: Also delete the indexed documents themselves
   */
  dropIndex: DROPINDEX,
  /**
   * Returns the execution plan for a complex query.
   * @param index - Name of the index to explain query against
   * @param query - The query string to explain
   * @param options - Optional parameters:
   *   - PARAMS: Named parameters to use in the query
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  EXPLAIN,
  /**
   * Returns the execution plan for a complex query.
   * @param index - Name of the index to explain query against
   * @param query - The query string to explain
   * @param options - Optional parameters:
   *   - PARAMS: Named parameters to use in the query
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  explain: EXPLAIN,
  /**
   * Returns the execution plan for a complex query in a more verbose format than FT.EXPLAIN.
   * @param index - Name of the index to explain query against
   * @param query - The query string to explain
   * @param options - Optional parameters:
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  EXPLAINCLI,
  /**
   * Returns the execution plan for a complex query in a more verbose format than FT.EXPLAIN.
   * @param index - Name of the index to explain query against
   * @param query - The query string to explain
   * @param options - Optional parameters:
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  explainCli: EXPLAINCLI,
  /**
   * Performs a hybrid search combining multiple search expressions.
   * Supports multiple SEARCH and VECTOR expressions with various fusion methods.
   *
   * @experimental
   * NOTE: FT.Hybrid is still in experimental state
   * It's behaviour and function signature may change
   *
   * @param index - The index name to search
   * @param options - Hybrid search options including:
   *   - SEARCH: Text search expression with optional scoring
   *   - VSIM: Vector similarity expression with KNN/RANGE methods
   *   - COMBINE: Fusion method (RRF, LINEAR)
   *   - Post-processing operations: LOAD, GROUPBY, APPLY, SORTBY, FILTER
   *   - Tunable options: LIMIT, PARAMS, TIMEOUT
   */
  HYBRID,
  /**
   * Performs a hybrid search combining multiple search expressions.
   * Supports multiple SEARCH and VECTOR expressions with various fusion methods.
   *
   * @experimental
   * NOTE: FT.Hybrid is still in experimental state
   * It's behaviour and function signature may change
   *
   * @param index - The index name to search
   * @param options - Hybrid search options including:
   *   - SEARCH: Text search expression with optional scoring
   *   - VSIM: Vector similarity expression with KNN/RANGE methods
   *   - COMBINE: Fusion method (RRF, LINEAR)
   *   - Post-processing operations: LOAD, GROUPBY, APPLY, SORTBY, FILTER
   *   - Tunable options: LIMIT, PARAMS, TIMEOUT
   */
  hybrid: HYBRID,
  /**
   * Returns information and statistics about an index.
   * @param index - Name of the index to get information about
   */
  INFO,
  /**
   * Returns information and statistics about an index.
   * @param index - Name of the index to get information about
   */
  info: INFO,
  /**
   * Profiles the execution of a search query for performance analysis.
   * @param index - Name of the index to profile query against
   * @param query - The search query to profile
   * @param options - Optional parameters:
   *   - LIMITED: Collect limited timing information only
   *   - All options supported by FT.SEARCH command
   */
  PROFILESEARCH,
  /**
   * Profiles the execution of a search query for performance analysis.
   * @param index - Name of the index to profile query against
   * @param query - The search query to profile
   * @param options - Optional parameters:
   *   - LIMITED: Collect limited timing information only
   *   - All options supported by FT.SEARCH command
   */
  profileSearch: PROFILESEARCH,
  /**
   * Profiles the execution of an aggregation query for performance analysis.
   * @param index - Name of the index to profile query against
   * @param query - The aggregation query to profile
   * @param options - Optional parameters:
   *   - LIMITED: Collect limited timing information only
   *   - All options supported by FT.AGGREGATE command
   */
  PROFILEAGGREGATE,
  /**
   * Profiles the execution of an aggregation query for performance analysis.
   * @param index - Name of the index to profile query against
   * @param query - The aggregation query to profile
   * @param options - Optional parameters:
   *   - LIMITED: Collect limited timing information only
   *   - All options supported by FT.AGGREGATE command
   */
  profileAggregate: PROFILEAGGREGATE,
  /**
   * Performs a search query but returns only document ids without their contents.
   * @param args - Same parameters as FT.SEARCH:
   *   - parser: The command parser
   *   - index: Name of the index to search
   *   - query: The text query to search
   *   - options: Optional search parameters
   */
  SEARCH_NOCONTENT,
  /**
   * Performs a search query but returns only document ids without their contents.
   * @param args - Same parameters as FT.SEARCH:
   *   - parser: The command parser
   *   - index: Name of the index to search
   *   - query: The text query to search
   *   - options: Optional search parameters
   */
  searchNoContent: SEARCH_NOCONTENT,
  /**
   * Searches a RediSearch index with the given query.
   * @param index - The index name to search
   * @param query - The text query to search. For syntax, see https://redis.io/docs/stack/search/reference/query_syntax
   * @param options - Optional search parameters including:
   *   - VERBATIM: do not try to use stemming for query expansion
   *   - NOSTOPWORDS: do not filter stopwords from the query
   *   - INKEYS/INFIELDS: restrict the search to specific keys/fields
   *   - RETURN: limit which fields are returned
   *   - SUMMARIZE/HIGHLIGHT: create search result highlights
   *   - LIMIT: pagination control
   *   - SORTBY: sort results by a specific field
   *   - PARAMS: bind parameters to the query
   */
  SEARCH,
  /**
   * Searches a RediSearch index with the given query.
   * @param index - The index name to search
   * @param query - The text query to search. For syntax, see https://redis.io/docs/stack/search/reference/query_syntax
   * @param options - Optional search parameters including:
   *   - VERBATIM: do not try to use stemming for query expansion
   *   - NOSTOPWORDS: do not filter stopwords from the query
   *   - INKEYS/INFIELDS: restrict the search to specific keys/fields
   *   - RETURN: limit which fields are returned
   *   - SUMMARIZE/HIGHLIGHT: create search result highlights
   *   - LIMIT: pagination control
   *   - SORTBY: sort results by a specific field
   *   - PARAMS: bind parameters to the query
   */
  search: SEARCH,
  /**
   * Performs spelling correction on a search query.
   * @param index - Name of the index to use for spelling corrections
   * @param query - The search query to check for spelling
   * @param options - Optional parameters:
   *   - DISTANCE: Maximum Levenshtein distance for spelling suggestions
   *   - TERMS: Custom dictionary terms to include/exclude
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  SPELLCHECK,
  /**
   * Performs spelling correction on a search query.
   * @param index - Name of the index to use for spelling corrections
   * @param query - The search query to check for spelling
   * @param options - Optional parameters:
   *   - DISTANCE: Maximum Levenshtein distance for spelling suggestions
   *   - TERMS: Custom dictionary terms to include/exclude
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  spellCheck: SPELLCHECK,
  /**
   * Adds a suggestion string to an auto-complete suggestion dictionary.
   * @param key - The suggestion dictionary key
   * @param string - The suggestion string to add
   * @param score - The suggestion score used for sorting
   * @param options - Optional parameters:
   *   - INCR: If true, increment the existing entry's score
   *   - PAYLOAD: Optional payload to associate with the suggestion
   */
  SUGADD,
  /**
   * Adds a suggestion string to an auto-complete suggestion dictionary.
   * @param key - The suggestion dictionary key
   * @param string - The suggestion string to add
   * @param score - The suggestion score used for sorting
   * @param options - Optional parameters:
   *   - INCR: If true, increment the existing entry's score
   *   - PAYLOAD: Optional payload to associate with the suggestion
   */
  sugAdd: SUGADD,
  /**
   * Deletes a string from a suggestion dictionary.
   * @param key - The suggestion dictionary key
   * @param string - The suggestion string to delete
   */
  SUGDEL,
  /**
   * Deletes a string from a suggestion dictionary.
   * @param key - The suggestion dictionary key
   * @param string - The suggestion string to delete
   */
  sugDel: SUGDEL,
  /**
   * Gets completion suggestions with their payloads from a suggestion dictionary.
   * @param args - Same parameters as FT.SUGGET:
   *   - parser: The command parser
   *   - key: The suggestion dictionary key
   *   - prefix: The prefix to get completion suggestions for
   *   - options: Optional parameters for fuzzy matching and max results
   */
  SUGGET_WITHPAYLOADS,
  /**
   * Gets completion suggestions with their payloads from a suggestion dictionary.
   * @param args - Same parameters as FT.SUGGET:
   *   - parser: The command parser
   *   - key: The suggestion dictionary key
   *   - prefix: The prefix to get completion suggestions for
   *   - options: Optional parameters for fuzzy matching and max results
   */
  sugGetWithPayloads: SUGGET_WITHPAYLOADS,
  /**
   * Gets completion suggestions with their scores and payloads from a suggestion dictionary.
   * @param args - Same parameters as FT.SUGGET:
   *   - parser: The command parser
   *   - key: The suggestion dictionary key
   *   - prefix: The prefix to get completion suggestions for
   *   - options: Optional parameters for fuzzy matching and max results
   */
  SUGGET_WITHSCORES_WITHPAYLOADS,
  /**
   * Gets completion suggestions with their scores and payloads from a suggestion dictionary.
   * @param args - Same parameters as FT.SUGGET:
   *   - parser: The command parser
   *   - key: The suggestion dictionary key
   *   - prefix: The prefix to get completion suggestions for
   *   - options: Optional parameters for fuzzy matching and max results
   */
  sugGetWithScoresWithPayloads: SUGGET_WITHSCORES_WITHPAYLOADS,
  /**
   * Gets completion suggestions with their scores from a suggestion dictionary.
   * @param args - Same parameters as FT.SUGGET:
   *   - parser: The command parser
   *   - key: The suggestion dictionary key
   *   - prefix: The prefix to get completion suggestions for
   *   - options: Optional parameters for fuzzy matching and max results
   */
  SUGGET_WITHSCORES,
  /**
   * Gets completion suggestions with their scores from a suggestion dictionary.
   * @param args - Same parameters as FT.SUGGET:
   *   - parser: The command parser
   *   - key: The suggestion dictionary key
   *   - prefix: The prefix to get completion suggestions for
   *   - options: Optional parameters for fuzzy matching and max results
   */
  sugGetWithScores: SUGGET_WITHSCORES,
  /**
   * Gets completion suggestions for a prefix from a suggestion dictionary.
   * @param key - The suggestion dictionary key
   * @param prefix - The prefix to get completion suggestions for
   * @param options - Optional parameters:
   *   - FUZZY: Enable fuzzy prefix matching
   *   - MAX: Maximum number of results to return
   */
  SUGGET,
  /**
   * Gets completion suggestions for a prefix from a suggestion dictionary.
   * @param key - The suggestion dictionary key
   * @param prefix - The prefix to get completion suggestions for
   * @param options - Optional parameters:
   *   - FUZZY: Enable fuzzy prefix matching
   *   - MAX: Maximum number of results to return
   */
  sugGet: SUGGET,
  /**
   * Gets the size of a suggestion dictionary.
   * @param key - The suggestion dictionary key
   */
  SUGLEN,
  /**
   * Gets the size of a suggestion dictionary.
   * @param key - The suggestion dictionary key
   */
  sugLen: SUGLEN,
  /**
   * Dumps the contents of a synonym group.
   * @param index - Name of the index that contains the synonym group
   */
  SYNDUMP,
  /**
   * Dumps the contents of a synonym group.
   * @param index - Name of the index that contains the synonym group
   */
  synDump: SYNDUMP,
  /**
   * Updates a synonym group with new terms.
   * @param index - Name of the index that contains the synonym group
   * @param groupId - ID of the synonym group to update
   * @param terms - One or more synonym terms to add to the group
   * @param options - Optional parameters:
   *   - SKIPINITIALSCAN: Skip the initial scan for existing documents
   */
  SYNUPDATE,
  /**
   * Updates a synonym group with new terms.
   * @param index - Name of the index that contains the synonym group
   * @param groupId - ID of the synonym group to update
   * @param terms - One or more synonym terms to add to the group
   * @param options - Optional parameters:
   *   - SKIPINITIALSCAN: Skip the initial scan for existing documents
   */
  synUpdate: SYNUPDATE,
  /**
   * Returns the distinct values in a TAG field.
   * @param index - Name of the index
   * @param fieldName - Name of the TAG field to get values from
   */
  TAGVALS,
  /**
   * Returns the distinct values in a TAG field.
   * @param index - Name of the index
   * @param fieldName - Name of the TAG field to get values from
   */
  tagVals: TAGVALS
};
