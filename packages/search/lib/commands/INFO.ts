import { RedisArgument } from "@redis/client";
import { ArrayReply, BlobStringReply, Command, DoubleReply, MapReply, NullReply, NumberReply, ReplyUnion, SimpleStringReply, TypeMapping } from "@redis/client/dist/lib/RESP/types";
import { createTransformTuplesReplyFunc, transformDoubleReply } from "@redis/client/dist/lib/commands/generic-transformers";

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument) {
    return ['FT.INFO', index];
  },
  transformReply: {
    2: transformV2Reply,
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;

export interface InfoReply {
  indexName: SimpleStringReply;
  indexOptions: ArrayReply<SimpleStringReply>;
  indexDefinition: MapReply<SimpleStringReply, SimpleStringReply>;
  attributes: Array<MapReply<SimpleStringReply, SimpleStringReply>>;
  numDocs: NumberReply
  maxDocId: NumberReply;
  numTerms: NumberReply;
  numRecords: NumberReply;
  invertedSzMb: DoubleReply;
  vectorIndexSzMb: DoubleReply;
  totalInvertedIndexBlocks: NumberReply;
  offsetVectorsSzMb: DoubleReply;
  docTableSizeMb: DoubleReply;
  sortableValuesSizeMb: DoubleReply;
  keyTableSizeMb: DoubleReply;
  tagOverheadSizeMb: DoubleReply;
  textOverheadSizeMb: DoubleReply;
  totalIndexMemorySizeMb: DoubleReply;
  geoshapeSizeMb: DoubleReply;
  recordsPerDocAvg: DoubleReply;
  bytesPerRecordAvg: DoubleReply;
  offsetsPerTermAvg: DoubleReply;
  offsetBitsPerRecordAvg: DoubleReply;
  hashIndexingFailures: NumberReply;
  totalIndexingTime: DoubleReply;
  indexing: NumberReply;
  percentIndexed: DoubleReply;
  numberOfUses: NumberReply;
  cleaning: NumberReply;
  gcStats: {
    bytesCollected: DoubleReply;
    totalMsRun: DoubleReply;
    totalCycles: DoubleReply;
    averageCycleTimeMs: DoubleReply;
    lastRunTimeMs: DoubleReply;
    gcNumericTreesMissed: DoubleReply;
    gcBlocksDenied: DoubleReply;
  };
  cursorStats: {
    globalIdle: NumberReply;
    globalTotal: NumberReply;
    indexCapacity: NumberReply;
    indexTotal: NumberReply;
  };
  stopWords?: ArrayReply<BlobStringReply | NullReply>;
}

function transformV2Reply(reply: Array<any>, preserve?: any, typeMapping?: TypeMapping): InfoReply {
  const myTransformFunc = createTransformTuplesReplyFunc<SimpleStringReply>(preserve, typeMapping);

  const ret = {} as unknown as InfoReply;

  for (let i=0; i < reply.length; i += 2) {
    const key = reply[i].toString();

    switch (key) {
      case 'index_name':
        ret.indexName = reply[i+1];
        break;
      case 'index_options':
        ret.indexOptions = reply[i+1];
        break;
      case 'index_definition':
        ret.indexDefinition = myTransformFunc(reply[i+1]);
        break;
      case 'attributes':
        ret.attributes = (reply[i+1] as Array<ArrayReply<SimpleStringReply>>).map(attribute => myTransformFunc(attribute));
        break;
      case 'num_docs':
        ret.numDocs = reply[i+1];
        break;
      case 'max_doc_id':
        ret.maxDocId = reply[i+1];
        break;
      case 'num_terms':
        ret.numTerms = reply[i+1];
        break;
      case 'num_records':
        ret.numRecords = reply[i+1];
        break;
      case 'inverted_sz_mb':
        ret.invertedSzMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'vector_index_sz_mb':
        ret.vectorIndexSzMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'total_inverted_index_blocks':
        ret.totalInvertedIndexBlocks = reply[i+1];
        break;
      case 'offset_vectors_sz_mb':
        ret.offsetVectorsSzMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'doc_table_size_mb':
        ret.docTableSizeMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'sortable_values_size_mb':
        ret.sortableValuesSizeMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'key_table_size_mb':
        ret.keyTableSizeMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'tag_overhead_sz_mb':
        ret.tagOverheadSizeMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'text_overhead_sz_mb':
        ret.textOverheadSizeMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'total_index_memory_sz_mb':
        ret.totalIndexMemorySizeMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'geoshapes_sz_mb':
        ret.geoshapeSizeMb = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'records_per_doc_avg':
        ret.recordsPerDocAvg = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'bytes_per_record_avg':
        ret.bytesPerRecordAvg = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'offsets_per_term_avg':
        ret.offsetsPerTermAvg = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'offset_bits_per_record_avg':
        ret.offsetBitsPerRecordAvg = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'hash_indexing_failures':
        ret.hashIndexingFailures = reply[i+1];
        break;
      case 'total_indexing_time':
        ret.totalIndexingTime = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'indexing':
        ret.indexing = reply[i+1];
        break;
      case 'percent_indexed':
        ret.percentIndexed = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'number_of_uses':
        ret.numberOfUses = reply[i+1];
        break;
      case 'cleaning':
        ret.cleaning = reply[i+1];
        break;
      case 'gc_stats': {
        const func = (array: Array<any>) => {
          const innerRet = {} as unknown as InfoReply['gcStats'];

          for (let i=0; i < array.length; i += 2) {
            const innerKey = array[i].toString();

            switch (innerKey) {
              case 'bytes_collected':
                innerRet.bytesCollected = transformDoubleReply[2](array[i+1], undefined, typeMapping) as DoubleReply;
                break;
              case 'total_ms_run':
                innerRet.totalMsRun = transformDoubleReply[2](array[i+1], undefined, typeMapping) as DoubleReply;
                break;
              case 'total_cycles':
                innerRet.totalCycles = transformDoubleReply[2](array[i+1], undefined, typeMapping) as DoubleReply;
                break;
              case 'average_cycle_time_ms':
                innerRet.averageCycleTimeMs = transformDoubleReply[2](array[i+1], undefined, typeMapping) as DoubleReply;
                break;
              case 'last_run_time_ms':
                innerRet.lastRunTimeMs = transformDoubleReply[2](array[i+1], undefined, typeMapping) as DoubleReply;
                break;
              case 'gc_numeric_trees_missed':
                innerRet.gcNumericTreesMissed = transformDoubleReply[2](array[i+1], undefined, typeMapping) as DoubleReply;
                break;
              case 'gc_blocks_denied':
                innerRet.gcBlocksDenied = transformDoubleReply[2](array[i+1], undefined, typeMapping) as DoubleReply;
                break;
            }
          }

          return innerRet;
        }
        ret.gcStats = func(reply[i+1]);
        break;
      }
      case 'cursor_stats': {
        const func = (array: Array<any>) => {
          const innerRet = {} as unknown as InfoReply['cursorStats'];

          for (let i=0; i < array.length; i += 2) {
            const innerKey = array[i].toString();

            switch (innerKey) {
              case 'global_idle':
                innerRet.globalIdle = array[i+1];
                break;
              case 'global_total':
                innerRet.globalTotal = array[i+1];
                break;
              case 'index_capacity':
                innerRet.indexCapacity = array[i+1];
                break;
              case 'index_total':
                innerRet.indexTotal = array[i+1];
                break;
            }
          }

          return innerRet;
        }
        ret.cursorStats = func(reply[i+1]);
        break;
      }
      case 'stopwords_list':
        ret.stopWords = reply[i+1];
    }  
  }

  return ret;
}
