import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument } from "@redis/client";
import { ArrayReply, BlobStringReply, Command, DoubleReply, MapReply, NullReply, NumberReply, ReplyUnion, SimpleStringReply, TypeMapping } from "@redis/client/lib/RESP/types";
import { createTransformTuplesReplyFunc, transformDoubleReply } from "@redis/client/lib/commands/generic-transformers";
import { TuplesReply } from '@redis/client/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, index: RedisArgument) {
    parser.push('FT.INFO', index);
  },
  transformReply: {
    2: transformV2Reply,
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;

export interface InfoReply {
  index_name: SimpleStringReply;
  index_options: ArrayReply<SimpleStringReply>;
  index_definition: MapReply<SimpleStringReply, SimpleStringReply>;
  attributes: Array<MapReply<SimpleStringReply, SimpleStringReply>>;
  num_docs: NumberReply
  max_doc_id: NumberReply;
  num_terms: NumberReply;
  num_records: NumberReply;
  inverted_sz_mb: DoubleReply;
  vector_index_sz_mb: DoubleReply;
  total_inverted_index_blocks: NumberReply;
  offset_vectors_sz_mb: DoubleReply;
  doc_table_size_mb: DoubleReply;
  sortable_values_size_mb: DoubleReply;
  key_table_size_mb: DoubleReply;
  tag_overhead_sz_mb: DoubleReply;
  text_overhead_sz_mb: DoubleReply;
  total_index_memory_sz_mb: DoubleReply;
  geoshapes_sz_mb: DoubleReply;
  records_per_doc_avg: DoubleReply;
  bytes_per_record_avg: DoubleReply;
  offsets_per_term_avg: DoubleReply;
  offset_bits_per_record_avg: DoubleReply;
  hash_indexing_failures: NumberReply;
  total_indexing_time: DoubleReply;
  indexing: NumberReply;
  percent_indexed: DoubleReply;
  number_of_uses: NumberReply;
  cleaning: NumberReply;
  gc_stats: {
    bytes_collected: DoubleReply;
    total_ms_run: DoubleReply;
    total_cycles: DoubleReply;
    average_cycle_time_ms: DoubleReply;
    last_run_time_ms: DoubleReply;
    gc_numeric_trees_missed: DoubleReply;
    gc_blocks_denied: DoubleReply;
  };
  cursor_stats: {
    global_idle: NumberReply;
    global_total: NumberReply;
    index_capacity: NumberReply;
    index_total: NumberReply;
  };
  stopwords_list?: ArrayReply<BlobStringReply> | TuplesReply<[NullReply]>;
}

function transformV2Reply(reply: Array<any>, preserve?: any, typeMapping?: TypeMapping): InfoReply {
  const myTransformFunc = createTransformTuplesReplyFunc<SimpleStringReply>(preserve, typeMapping);

  const ret = {} as unknown as InfoReply;

  for (let i=0; i < reply.length; i += 2) {
    const key = reply[i].toString() as keyof InfoReply;

    switch (key) {
      case 'index_name':
      case 'index_options':
      case 'num_docs':
      case 'max_doc_id':
      case 'num_terms':
      case 'num_records':
      case 'total_inverted_index_blocks':
      case 'hash_indexing_failures':
      case 'indexing':
      case 'number_of_uses':
      case 'cleaning':  
      case 'stopwords_list':
        ret[key] = reply[i+1];
        break;
      case 'inverted_sz_mb':
      case 'vector_index_sz_mb':
      case 'offset_vectors_sz_mb':
      case 'doc_table_size_mb':
      case 'sortable_values_size_mb':
      case 'key_table_size_mb':
      case 'text_overhead_sz_mb':
      case 'tag_overhead_sz_mb':
      case 'total_index_memory_sz_mb':
      case 'geoshapes_sz_mb':
      case 'records_per_doc_avg':
      case 'bytes_per_record_avg':
      case 'offsets_per_term_avg':
      case 'offset_bits_per_record_avg':
      case 'total_indexing_time':
      case 'percent_indexed':        
        ret[key] = transformDoubleReply[2](reply[i+1], undefined, typeMapping) as DoubleReply;
        break;
      case 'index_definition':
        ret[key] = myTransformFunc(reply[i+1]);
        break;
      case 'attributes':
        ret[key] = (reply[i+1] as Array<ArrayReply<SimpleStringReply>>).map(attribute => myTransformFunc(attribute));
        break;
      case 'gc_stats': {
        const innerRet = {} as unknown as InfoReply['gc_stats'];

        const array = reply[i+1];

        for (let i=0; i < array.length; i += 2) {
          const innerKey = array[i].toString() as keyof InfoReply['gc_stats'];

          switch (innerKey) {
            case 'bytes_collected':
            case 'total_ms_run':
            case 'total_cycles':
            case 'average_cycle_time_ms':
            case 'last_run_time_ms':
            case 'gc_numeric_trees_missed':
            case 'gc_blocks_denied':
              innerRet[innerKey] = transformDoubleReply[2](array[i+1], undefined, typeMapping) as DoubleReply;
              break;
          }
        }
        
        ret[key] = innerRet;
        break;
      }
      case 'cursor_stats': {
        const innerRet = {} as unknown as InfoReply['cursor_stats'];

        const array = reply[i+1];

        for (let i=0; i < array.length; i += 2) {
          const innerKey = array[i].toString() as keyof InfoReply['cursor_stats'];

          switch (innerKey) {
            case 'global_idle':
            case 'global_total':
            case 'index_capacity':
            case 'index_total':
              innerRet[innerKey] = array[i+1];
              break;
          }
        }

        ret[key] = innerRet;
        break;
      }
    }  
  }

  return ret;
}
