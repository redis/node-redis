import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CREATE, { SCHEMA_FIELD_TYPE, SCHEMA_TEXT_FIELD_PHONETIC, SCHEMA_VECTOR_FIELD_ALGORITHM, REDISEARCH_LANGUAGE, VAMANA_COMPRESSION_ALGORITHM } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.CREATE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}),
        ['FT.CREATE', 'index', 'SCHEMA']
      );
    });

    describe('with fields', () => {
      describe('TEXT', () => {
        it('without options', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: SCHEMA_FIELD_TYPE.TEXT
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT']
          );
        });

        it('with NOSTEM', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TEXT,
                NOSTEM: true
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'NOSTEM']
          );
        });

        it('with WEIGHT', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TEXT,
                WEIGHT: 1
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'WEIGHT', '1']
          );
        });

        it('with PHONETIC', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TEXT,
                PHONETIC: SCHEMA_TEXT_FIELD_PHONETIC.DM_EN
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'PHONETIC', SCHEMA_TEXT_FIELD_PHONETIC.DM_EN]
          );
        });

        it('with WITHSUFFIXTRIE', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TEXT,
                WITHSUFFIXTRIE: true
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'WITHSUFFIXTRIE']
          );
        });
      });

      it('NUMERIC', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {
            field: SCHEMA_FIELD_TYPE.NUMERIC
          }),
          ['FT.CREATE', 'index', 'SCHEMA', 'field', 'NUMERIC']
        );
      });

      it('GEO', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {
            field: SCHEMA_FIELD_TYPE.GEO
          }),
          ['FT.CREATE', 'index', 'SCHEMA', 'field', 'GEO']
        );
      });

      describe('TAG', () => {
        describe('without options', () => {
          it('SCHEMA_FIELD_TYPE.TAG', () => {
            assert.deepEqual(
              parseArgs(CREATE, 'index', {
                field: SCHEMA_FIELD_TYPE.TAG
              }),
              ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG']
            );
          });

          it('{ type: SCHEMA_FIELD_TYPE.TAG }', () => {
            assert.deepEqual(
              parseArgs(CREATE, 'index', {
                field: {
                  type: SCHEMA_FIELD_TYPE.TAG
                }
              }),
              ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG']
            );
          });
        });

        it('with SEPARATOR', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TAG,
                SEPARATOR: 'separator'
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG', 'SEPARATOR', 'separator']
          );
        });

        it('with CASESENSITIVE', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TAG,
                CASESENSITIVE: true
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG', 'CASESENSITIVE']
          );
        });

        it('with WITHSUFFIXTRIE', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TAG,
                WITHSUFFIXTRIE: true
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG', 'WITHSUFFIXTRIE']
          );
        });

	it('with INDEXEMPTY', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TAG,
                INDEXEMPTY: true
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TAG', 'INDEXEMPTY']
          );
        });
      });

      describe('VECTOR', () => {
        it('Flat algorithm', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.VECTOR,
                ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.FLAT,
                TYPE: 'FLOAT32',
                DIM: 2,
                DISTANCE_METRIC: 'L2',
                INITIAL_CAP: 1000000,
                BLOCK_SIZE: 1000
              }
            }),
            [
              'FT.CREATE', 'index', 'SCHEMA', 'field', 'VECTOR', 'FLAT', '10', 'TYPE',
              'FLOAT32', 'DIM', '2', 'DISTANCE_METRIC', 'L2', 'INITIAL_CAP', '1000000',
              'BLOCK_SIZE', '1000'
            ]
          );
        });

        it('HNSW algorithm', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.VECTOR,
                ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW,
                TYPE: 'FLOAT32',
                DIM: 2,
                DISTANCE_METRIC: 'L2',
                INITIAL_CAP: 1000000,
                M: 40,
                EF_CONSTRUCTION: 250,
                EF_RUNTIME: 20
              }
            }),
            [
              'FT.CREATE', 'index', 'SCHEMA', 'field', 'VECTOR', 'HNSW', '14', 'TYPE',
              'FLOAT32', 'DIM', '2', 'DISTANCE_METRIC', 'L2', 'INITIAL_CAP', '1000000',
              'M', '40', 'EF_CONSTRUCTION', '250', 'EF_RUNTIME', '20'
            ]
          );
        });

        it('VAMANA algorithm', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.VECTOR,
                ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.VAMANA,
                TYPE: "FLOAT32",
                COMPRESSION: VAMANA_COMPRESSION_ALGORITHM.LVQ8,
                DIM: 1024,
                DISTANCE_METRIC: 'COSINE',
                CONSTRUCTION_WINDOW_SIZE: 300,
                GRAPH_MAX_DEGREE: 128,
                SEARCH_WINDOW_SIZE: 20,
                EPSILON: 0.02,
                TRAINING_THRESHOLD: 20480,
                REDUCE: 512,
              }
            }),
            [
              'FT.CREATE', 'index', 'SCHEMA', 'field', 'VECTOR', 'SVS-VAMANA', '20', 'TYPE',
              'FLOAT32', 'DIM', '1024', 'DISTANCE_METRIC', 'COSINE', 'COMPRESSION', 'LVQ8',
              'CONSTRUCTION_WINDOW_SIZE', '300', 'GRAPH_MAX_DEGREE', '128', 'SEARCH_WINDOW_SIZE', '20',
              'EPSILON', '0.02', 'TRAINING_THRESHOLD', '20480', 'REDUCE', '512'
            ]
          );
        });
      });

      describe('GEOSHAPE', () => {
        describe('without options', () => {
          it('SCHEMA_FIELD_TYPE.GEOSHAPE', () => {
            assert.deepEqual(
              parseArgs(CREATE, 'index', {
                field: SCHEMA_FIELD_TYPE.GEOSHAPE
              }),
              ['FT.CREATE', 'index', 'SCHEMA', 'field', 'GEOSHAPE']
            );
          });

          it('{ type: SCHEMA_FIELD_TYPE.GEOSHAPE }', () => {
            assert.deepEqual(
              parseArgs(CREATE, 'index', {
                field: {
                  type: SCHEMA_FIELD_TYPE.GEOSHAPE
                }
              }),
              ['FT.CREATE', 'index', 'SCHEMA', 'field', 'GEOSHAPE']
            );
          });
        });

        it('with COORD_SYSTEM', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.GEOSHAPE,
                COORD_SYSTEM: 'SPHERICAL'
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'GEOSHAPE', 'COORD_SYSTEM', 'SPHERICAL']
          );
        });
      });
  
      it('with AS', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {
            field: {
              type: SCHEMA_FIELD_TYPE.TEXT,
              AS: 'as'
            }
          }),
          ['FT.CREATE', 'index', 'SCHEMA', 'field', 'AS', 'as', 'TEXT']
        );
      });

      describe('with SORTABLE', () => {
        it('true', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TEXT,
                SORTABLE: true
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'SORTABLE']
          );
        });

        it('UNF', () => {
          assert.deepEqual(
            parseArgs(CREATE, 'index', {
              field: {
                type: SCHEMA_FIELD_TYPE.TEXT,
                SORTABLE: 'UNF'
              }
            }),
            ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'SORTABLE', 'UNF']
          );
        });
      });

      it('with NOINDEX', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {
            field: {
              type: SCHEMA_FIELD_TYPE.TEXT,
              NOINDEX: true
            }
          }),
          ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'NOINDEX']
        );
      });

      it('with INDEXMISSING', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {
            field: {
              type: SCHEMA_FIELD_TYPE.TEXT,
              INDEXMISSING: true
            }
          }),
          ['FT.CREATE', 'index', 'SCHEMA', 'field', 'TEXT', 'INDEXMISSING']
        );
      });
    });

    it('with ON', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          ON: 'HASH'
        }),
        ['FT.CREATE', 'index', 'ON', 'HASH', 'SCHEMA']
      );
    });

    describe('with PREFIX', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {}, {
            PREFIX: 'prefix'
          }),
          ['FT.CREATE', 'index', 'PREFIX', '1', 'prefix', 'SCHEMA']
        );
      });

      it('Array', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {}, {
            PREFIX: ['1', '2']
          }),
          ['FT.CREATE', 'index', 'PREFIX', '2', '1', '2', 'SCHEMA']
        );
      });
    });

    it('with FILTER', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          FILTER: '@field != ""'
        }),
        ['FT.CREATE', 'index', 'FILTER', '@field != ""', 'SCHEMA']
      );
    });

    it('with LANGUAGE', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          LANGUAGE: REDISEARCH_LANGUAGE.ARABIC
        }),
        ['FT.CREATE', 'index', 'LANGUAGE', REDISEARCH_LANGUAGE.ARABIC, 'SCHEMA']
      );
    });

    it('with LANGUAGE_FIELD', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          LANGUAGE_FIELD: '@field'
        }),
        ['FT.CREATE', 'index', 'LANGUAGE_FIELD', '@field', 'SCHEMA']
      );
    });

    it('with SCORE', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          SCORE: 1
        }),
        ['FT.CREATE', 'index', 'SCORE', '1', 'SCHEMA']
      );
    });

    it('with SCORE_FIELD', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          SCORE_FIELD: '@field'
        }),
        ['FT.CREATE', 'index', 'SCORE_FIELD', '@field', 'SCHEMA']
      );
    });

    it('with MAXTEXTFIELDS', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          MAXTEXTFIELDS: true
        }),
        ['FT.CREATE', 'index', 'MAXTEXTFIELDS', 'SCHEMA']
      );
    });

    it('with TEMPORARY', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          TEMPORARY: 1
        }),
        ['FT.CREATE', 'index', 'TEMPORARY', '1', 'SCHEMA']
      );
    });

    it('with NOOFFSETS', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          NOOFFSETS: true
        }),
        ['FT.CREATE', 'index', 'NOOFFSETS', 'SCHEMA']
      );
    });

    it('with NOHL', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          NOHL: true
        }),
        ['FT.CREATE', 'index', 'NOHL', 'SCHEMA']
      );
    });

    it('with NOFIELDS', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          NOFIELDS: true
        }),
        ['FT.CREATE', 'index', 'NOFIELDS', 'SCHEMA']
      );
    });

    it('with NOFREQS', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          NOFREQS: true
        }),
        ['FT.CREATE', 'index', 'NOFREQS', 'SCHEMA']
      );
    });

    it('with SKIPINITIALSCAN', () => {
      assert.deepEqual(
        parseArgs(CREATE, 'index', {}, {
          SKIPINITIALSCAN: true
        }),
        ['FT.CREATE', 'index', 'SKIPINITIALSCAN', 'SCHEMA']
      );
    });

    describe('with STOPWORDS', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {}, {
            STOPWORDS: 'stopword'
          }),
          ['FT.CREATE', 'index', 'STOPWORDS', '1', 'stopword', 'SCHEMA']
        );
      });

      it('Array', () => {
        assert.deepEqual(
          parseArgs(CREATE, 'index', {}, {
            STOPWORDS: ['1', '2']
          }),
          ['FT.CREATE', 'index', 'STOPWORDS', '2', '1', '2', 'SCHEMA']
        );
      });
    });
  });

  testUtils.testWithClient('client.ft.create', async client => {
    assert.equal(
      await client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[7], 'LATEST'], 'client.ft.create vector types big floats', async client => {
    assert.equal(
      await client.ft.create("index_float32", {
        field: {
          ALGORITHM: "FLAT",
          TYPE: "FLOAT32",
          DIM: 1,
          DISTANCE_METRIC: 'COSINE',
          type: 'VECTOR'
        },
      }),
      "OK"
    );

    assert.equal(
      await client.ft.create("index_float64", {
        field: {
          ALGORITHM: "FLAT",
          TYPE: "FLOAT64",
          DIM: 1,
          DISTANCE_METRIC: 'COSINE',
          type: 'VECTOR'
        },
      }),
      "OK"
    );
  }, GLOBAL.SERVERS.OPEN);


  testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'client.ft.create vector types small floats and ints', async client => {
    assert.equal(
      await client.ft.create("index_float16", {
        field: {
          ALGORITHM: "FLAT",
          TYPE: "FLOAT16",
          DIM: 1,
          DISTANCE_METRIC: 'COSINE',
          type: 'VECTOR'
        },
      }),
      "OK"
    );

    assert.equal(
      await client.ft.create("index_bloat16", {
        field: {
          ALGORITHM: "FLAT",
          TYPE: "BFLOAT16",
          DIM: 1,
          DISTANCE_METRIC: 'COSINE',
          type: 'VECTOR'
        },
      }),
      "OK"
    );
   
    assert.equal(
      await client.ft.create("index_int8", {
        field: {
          ALGORITHM: "FLAT",
          TYPE: "INT8",
          DIM: 1,
          DISTANCE_METRIC: 'COSINE',
          type: 'VECTOR'
        },
      }),
      "OK"
    );

    assert.equal(
      await client.ft.create("index_uint8", {
        field: {
          ALGORITHM: "FLAT",
          TYPE: "UINT8",
          DIM: 1,
          DISTANCE_METRIC: 'COSINE',
          type: 'VECTOR'
        },
      }),
      "OK"
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 2], 'LATEST'], 'client.ft.create vector svs-vamana', async client => {
    assert.equal(
      await client.ft.create("index_svs_vamana_min_config", {
        field: {
          type: SCHEMA_FIELD_TYPE.VECTOR,
          ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.VAMANA,
          TYPE: "FLOAT32",
          DIM: 768,
          DISTANCE_METRIC: 'L2',
        },
      }),
      "OK"
    );

    assert.equal(
      await client.ft.create("index_svs_vamana_no_compression", {
        field: {
          type: SCHEMA_FIELD_TYPE.VECTOR,
          ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.VAMANA,
          TYPE: "FLOAT32",
          DIM: 512,
          DISTANCE_METRIC: 'L2',
          CONSTRUCTION_WINDOW_SIZE: 200,
          GRAPH_MAX_DEGREE: 64,
          SEARCH_WINDOW_SIZE: 50,
          EPSILON: 0.01
        },
      }),
      "OK"
    );

    assert.equal(
      await client.ft.create("index_svs_vamana_compression", {
        field: {
          type: SCHEMA_FIELD_TYPE.VECTOR,
          ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.VAMANA,
          TYPE: "FLOAT32",
          COMPRESSION: VAMANA_COMPRESSION_ALGORITHM.LeanVec4x8,
          DIM: 1024,
          DISTANCE_METRIC: 'COSINE',
          CONSTRUCTION_WINDOW_SIZE: 300,
          GRAPH_MAX_DEGREE: 128,
          SEARCH_WINDOW_SIZE: 20,
          EPSILON: 0.02,
          TRAINING_THRESHOLD: 20480,
          REDUCE: 512,
        },
      }),
      "OK"
    );

    assert.equal(
      await client.ft.create("index_svs_vamana_float16", {
        field: {
          type: SCHEMA_FIELD_TYPE.VECTOR,
          ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.VAMANA,
          TYPE: "FLOAT16",
          DIM: 128,
          DISTANCE_METRIC: 'IP',
        },
      }),
      "OK"
    );

    await assert.rejects(
      client.ft.create("index_svs_vamana_invalid_config", {
        field: {
          type: SCHEMA_FIELD_TYPE.VECTOR,
          ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.VAMANA,
          TYPE: "FLOAT32",
          DIM: 2,
          DISTANCE_METRIC: 'L2',
          CONSTRUCTION_WINDOW_SIZE: 200,
          GRAPH_MAX_DEGREE: 64,
          SEARCH_WINDOW_SIZE: 50,
          EPSILON: 0.01,
          // TRAINING_THRESHOLD should error without COMPRESSION
          TRAINING_THRESHOLD: 2048
        },
      }),
    )
  }, GLOBAL.SERVERS.OPEN);
});
