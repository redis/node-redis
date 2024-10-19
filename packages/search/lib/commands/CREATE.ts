import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument, parseOptionalVariadicArgument } from '@redis/client/lib/commands/generic-transformers';

export const SCHEMA_FIELD_TYPE = {
  TEXT: 'TEXT',
  NUMERIC: 'NUMERIC',
  GEO: 'GEO',
  TAG: 'TAG',
  VECTOR: 'VECTOR',
  GEOSHAPE: 'GEOSHAPE'
} as const;

export type SchemaFieldType = typeof SCHEMA_FIELD_TYPE[keyof typeof SCHEMA_FIELD_TYPE];

interface SchemaField<T extends SchemaFieldType = SchemaFieldType> {
  type: T;
  AS?: RedisArgument;
  INDEXMISSING?: boolean;
}

interface SchemaCommonField<T extends SchemaFieldType = SchemaFieldType> extends SchemaField<T> {
  SORTABLE?: boolean | 'UNF'
  NOINDEX?: boolean;
}

export const SCHEMA_TEXT_FIELD_PHONETIC = {
  DM_EN: 'dm:en',
  DM_FR: 'dm:fr',
  FM_PT: 'dm:pt',
  DM_ES: 'dm:es'
} as const;

export type SchemaTextFieldPhonetic = typeof SCHEMA_TEXT_FIELD_PHONETIC[keyof typeof SCHEMA_TEXT_FIELD_PHONETIC];

interface SchemaTextField extends SchemaCommonField<typeof SCHEMA_FIELD_TYPE['TEXT']> {
  NOSTEM?: boolean;
  WEIGHT?: number;
  PHONETIC?: SchemaTextFieldPhonetic;
  WITHSUFFIXTRIE?: boolean;
  INDEXEMPTY?: boolean;
}

interface SchemaNumericField extends SchemaCommonField<typeof SCHEMA_FIELD_TYPE['NUMERIC']> {}

interface SchemaGeoField extends SchemaCommonField<typeof SCHEMA_FIELD_TYPE['GEO']> {}

interface SchemaTagField extends SchemaCommonField<typeof SCHEMA_FIELD_TYPE['TAG']> {
  SEPARATOR?: RedisArgument;
  CASESENSITIVE?: boolean;
  WITHSUFFIXTRIE?: boolean;
  INDEXEMPTY?: boolean;
}

export const SCHEMA_VECTOR_FIELD_ALGORITHM = {
  FLAT: 'FLAT',
  HNSW: 'HNSW'
} as const;

export type SchemaVectorFieldAlgorithm = typeof SCHEMA_VECTOR_FIELD_ALGORITHM[keyof typeof SCHEMA_VECTOR_FIELD_ALGORITHM];

interface SchemaVectorField extends SchemaField<typeof SCHEMA_FIELD_TYPE['VECTOR']> {
  ALGORITHM: SchemaVectorFieldAlgorithm;
  TYPE: string;
  DIM: number;
  DISTANCE_METRIC: 'L2' | 'IP' | 'COSINE';
  INITIAL_CAP?: number;
}

interface SchemaFlatVectorField extends SchemaVectorField {
  ALGORITHM: typeof SCHEMA_VECTOR_FIELD_ALGORITHM['FLAT'];
  BLOCK_SIZE?: number;
}

interface SchemaHNSWVectorField extends SchemaVectorField {
  ALGORITHM: typeof SCHEMA_VECTOR_FIELD_ALGORITHM['HNSW'];
  M?: number;
  EF_CONSTRUCTION?: number;
  EF_RUNTIME?: number;
}

export const SCHEMA_GEO_SHAPE_COORD_SYSTEM = {
  SPHERICAL: 'SPHERICAL',
  FLAT: 'FLAT'
} as const;

export type SchemaGeoShapeFieldCoordSystem = typeof SCHEMA_GEO_SHAPE_COORD_SYSTEM[keyof typeof SCHEMA_GEO_SHAPE_COORD_SYSTEM];

interface SchemaGeoShapeField extends SchemaField<typeof SCHEMA_FIELD_TYPE['GEOSHAPE']> {
  COORD_SYSTEM?: SchemaGeoShapeFieldCoordSystem;
}

export interface RediSearchSchema {
  [field: string]: (
    SchemaTextField |
    SchemaNumericField |
    SchemaGeoField |
    SchemaTagField |
    SchemaFlatVectorField |
    SchemaHNSWVectorField |
    SchemaGeoShapeField |
    SchemaFieldType
  );
}

function parseCommonSchemaFieldOptions(parser: CommandParser, fieldOptions: SchemaCommonField) {
  if (fieldOptions.SORTABLE) {
    parser.push('SORTABLE');

    if (fieldOptions.SORTABLE === 'UNF') {
      parser.push('UNF');
    }
  }

  if (fieldOptions.NOINDEX) {
    parser.push('NOINDEX');
  }
}

export function parseSchema(parser: CommandParser, schema: RediSearchSchema) {
  for (const [field, fieldOptions] of Object.entries(schema)) {
    parser.push(field);

    if (typeof fieldOptions === 'string') {
      parser.push(fieldOptions);
      continue;
    }

    if (fieldOptions.AS) {
      parser.push('AS', fieldOptions.AS);
    }

    parser.push(fieldOptions.type);

    if (fieldOptions.INDEXMISSING) {
      parser.push('INDEXMISSING');
    }

    switch (fieldOptions.type) {
      case SCHEMA_FIELD_TYPE.TEXT:
        if (fieldOptions.NOSTEM) {
          parser.push('NOSTEM');
        }

        if (fieldOptions.WEIGHT) {
          parser.push('WEIGHT', fieldOptions.WEIGHT.toString());
        }

        if (fieldOptions.PHONETIC) {
          parser.push('PHONETIC', fieldOptions.PHONETIC);
        }

        if (fieldOptions.WITHSUFFIXTRIE) {
          parser.push('WITHSUFFIXTRIE');
        }

        if (fieldOptions.INDEXEMPTY) {
          parser.push('INDEXEMPTY');
        }

        parseCommonSchemaFieldOptions(parser, fieldOptions)
        break;

      case SCHEMA_FIELD_TYPE.NUMERIC:
      case SCHEMA_FIELD_TYPE.GEO:
        parseCommonSchemaFieldOptions(parser, fieldOptions)
        break;

      case SCHEMA_FIELD_TYPE.TAG:
        if (fieldOptions.SEPARATOR) {
          parser.push('SEPARATOR', fieldOptions.SEPARATOR);
        }

        if (fieldOptions.CASESENSITIVE) {
          parser.push('CASESENSITIVE');
        }

        if (fieldOptions.WITHSUFFIXTRIE) {
          parser.push('WITHSUFFIXTRIE');
        }

        if (fieldOptions.INDEXEMPTY) {
          parser.push('INDEXEMPTY');
        }

        parseCommonSchemaFieldOptions(parser, fieldOptions)
        break;

      case SCHEMA_FIELD_TYPE.VECTOR:
        parser.push(fieldOptions.ALGORITHM);

        const args: Array<RedisArgument> = [];

        args.push(
          'TYPE', fieldOptions.TYPE,
          'DIM', fieldOptions.DIM.toString(),
          'DISTANCE_METRIC', fieldOptions.DISTANCE_METRIC
        );

        if (fieldOptions.INITIAL_CAP) {
          args.push('INITIAL_CAP', fieldOptions.INITIAL_CAP.toString());
        }

        switch (fieldOptions.ALGORITHM) {          
          case SCHEMA_VECTOR_FIELD_ALGORITHM.FLAT:
            if (fieldOptions.BLOCK_SIZE) {
              args.push('BLOCK_SIZE', fieldOptions.BLOCK_SIZE.toString());
            }

            break;

          case SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW:
            if (fieldOptions.M) {
              args.push('M', fieldOptions.M.toString());
            }

            if (fieldOptions.EF_CONSTRUCTION) {
              args.push('EF_CONSTRUCTION', fieldOptions.EF_CONSTRUCTION.toString());
            }

            if (fieldOptions.EF_RUNTIME) {
              args.push('EF_RUNTIME', fieldOptions.EF_RUNTIME.toString());
            }

            break;
        }
        parser.pushVariadicWithLength(args);

        break;
    
      case SCHEMA_FIELD_TYPE.GEOSHAPE:
        if (fieldOptions.COORD_SYSTEM !== undefined) {
          parser.push('COORD_SYSTEM', fieldOptions.COORD_SYSTEM);
        }

        break;
    }
  }
}

export const REDISEARCH_LANGUAGE = {
  ARABIC: 'Arabic',
  BASQUE: 'Basque',
  CATALANA: 'Catalan',
  DANISH: 'Danish',
  DUTCH: 'Dutch',
  ENGLISH: 'English',
  FINNISH: 'Finnish',
  FRENCH: 'French',
  GERMAN: 'German',
  GREEK: 'Greek',
  HUNGARIAN: 'Hungarian',
  INDONESAIN: 'Indonesian',
  IRISH: 'Irish',
  ITALIAN: 'Italian',
  LITHUANIAN: 'Lithuanian',
  NEPALI: 'Nepali',
  NORWEIGAN: 'Norwegian',
  PORTUGUESE: 'Portuguese',
  ROMANIAN: 'Romanian',
  RUSSIAN: 'Russian',
  SPANISH: 'Spanish',
  SWEDISH: 'Swedish',
  TAMIL: 'Tamil',
  TURKISH: 'Turkish',
  CHINESE: 'Chinese'
} as const;

export type RediSearchLanguage = typeof REDISEARCH_LANGUAGE[keyof typeof REDISEARCH_LANGUAGE];

export type RediSearchProperty = `${'@' | '$.'}${string}`;

export interface CreateOptions {
  ON?: 'HASH' | 'JSON';
  PREFIX?: RedisVariadicArgument;
  FILTER?: RedisArgument;
  LANGUAGE?: RediSearchLanguage;
  LANGUAGE_FIELD?: RediSearchProperty;
  SCORE?: number;
  SCORE_FIELD?: RediSearchProperty;
  // PAYLOAD_FIELD?: string;
  MAXTEXTFIELDS?: boolean;
  TEMPORARY?: number;
  NOOFFSETS?: boolean;
  NOHL?: boolean;
  NOFIELDS?: boolean;
  NOFREQS?: boolean;
  SKIPINITIALSCAN?: boolean;
  STOPWORDS?: RedisVariadicArgument;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, index: RedisArgument, schema: RediSearchSchema, options?: CreateOptions) {
    parser.push('FT.CREATE', index);

    if (options?.ON) {
      parser.push('ON', options.ON);
    }

    parseOptionalVariadicArgument(parser, 'PREFIX', options?.PREFIX);

    if (options?.FILTER) {
      parser.push('FILTER', options.FILTER);
    }

    if (options?.LANGUAGE) {
      parser.push('LANGUAGE', options.LANGUAGE);
    }

    if (options?.LANGUAGE_FIELD) {
      parser.push('LANGUAGE_FIELD', options.LANGUAGE_FIELD);
    }

    if (options?.SCORE) {
      parser.push('SCORE', options.SCORE.toString());
    }

    if (options?.SCORE_FIELD) {
      parser.push('SCORE_FIELD', options.SCORE_FIELD);
    }

    // if (options?.PAYLOAD_FIELD) {
    //     parser.push('PAYLOAD_FIELD', options.PAYLOAD_FIELD);
    // }

    if (options?.MAXTEXTFIELDS) {
      parser.push('MAXTEXTFIELDS');
    }

    if (options?.TEMPORARY) {
      parser.push('TEMPORARY', options.TEMPORARY.toString());
    }

    if (options?.NOOFFSETS) {
      parser.push('NOOFFSETS');
    }

    if (options?.NOHL) {
      parser.push('NOHL');
    }

    if (options?.NOFIELDS) {
      parser.push('NOFIELDS');
    }

    if (options?.NOFREQS) {
      parser.push('NOFREQS');
    }

    if (options?.SKIPINITIALSCAN) {
      parser.push('SKIPINITIALSCAN');
    }

    parseOptionalVariadicArgument(parser, 'STOPWORDS', options?.STOPWORDS);
    parser.push('SCHEMA');
    parseSchema(parser, schema);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
