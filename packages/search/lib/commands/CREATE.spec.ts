import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CREATE, { SCHEMA_FIELD_TYPE, SCHEMA_TEXT_FIELD_PHONETIC, SCHEMA_VECTOR_FIELD_ALGORITHM, REDISEARCH_LANGUAGE } from './CREATE';
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
});
