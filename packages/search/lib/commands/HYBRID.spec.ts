import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HYBRID from './HYBRID';
import { BasicCommandParser } from '@redis/client/lib/client/parser';

describe('FT.HYBRID', () => {
  describe('parseCommand', () => {
    it('minimal command', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index');
      assert.deepEqual(
        parser.redisArgs,
        ['FT.HYBRID', 'index']
      );
    });


    it('with SEARCH expression', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        SEARCH: {
          query: '@description: bikes'
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        ['FT.HYBRID', 'index', 'SEARCH', '@description: bikes']
      );
    });

    it('with SEARCH expression and SCORER', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        SEARCH: {
          query: '@description: bikes',
          SCORER: {
            algorithm: 'TFIDF.DOCNORM',
            params: ['param1', 'param2']
          },
          YIELD_SCORE_AS: 'search_score'
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'SEARCH', '@description: bikes',
          'SCORER', 'TFIDF.DOCNORM', 'param1', 'param2',
          'YIELD_SCORE_AS', 'search_score'
        ]
      );
    });

    it('with VSIM expression and KNN method', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        VSIM: {
          field: '@vector_field',
          vectorData: 'BLOB_DATA',
          method: {
            KNN: {
              K: 10,
              EF_RUNTIME: 50,
              YIELD_DISTANCE_AS: 'vector_dist'
            }
          }
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'VSIM', '@vector_field', 'BLOB_DATA',
          'KNN', '1', 'K', '10', 'EF_RUNTIME', '50', 'YIELD_DISTANCE_AS', 'vector_dist'
        ]
      );
    });

    it('with VSIM expression and RANGE method', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        VSIM: {
          field: '@vector_field',
          vectorData: 'BLOB_DATA',
          method: {
            RANGE: {
              RADIUS: 0.5,
              EPSILON: 0.01,
              YIELD_DISTANCE_AS: 'vector_dist'
            }
          }
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'VSIM', '@vector_field', 'BLOB_DATA',
          'RANGE', '1', 'RADIUS', '0.5', 'EPSILON', '0.01', 'YIELD_DISTANCE_AS', 'vector_dist'
        ]
      );
    });

    it('with VSIM expression and FILTER', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        VSIM: {
          field: '@vector_field',
          vectorData: 'BLOB_DATA',
          FILTER: {
            expression: '@category:{bikes}',
            POLICY: 'BATCHES',
            BATCHES: {
              BATCH_SIZE: 100
            }
          },
          YIELD_SCORE_AS: 'vsim_score'
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'VSIM', '@vector_field', 'BLOB_DATA',
          'FILTER', '@category:{bikes}', 'POLICY', 'BATCHES', 'BATCHES', 'BATCH_SIZE', '100',
          'YIELD_SCORE_AS', 'vsim_score'
        ]
      );
    });

    it('with RRF COMBINE method', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        COMBINE: {
          method: {
            RRF: {
              count: 2,
              WINDOW: 10,
              CONSTANT: 60
            }
          },
          YIELD_SCORE_AS: 'combined_score'
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'COMBINE', 'RRF', '2', 'WINDOW', '10', 'CONSTANT', '60',
          'YIELD_SCORE_AS', 'combined_score'
        ]
      );
    });

    it('with LINEAR COMBINE method', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        COMBINE: {
          method: {
            LINEAR: {
              count: 2,
              ALPHA: 0.7,
              BETA: 0.3
            }
          }
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'COMBINE', 'LINEAR', '2', 'ALPHA', '0.7', 'BETA', '0.3'
        ]
      );
    });

    it('with LOAD, SORTBY, and LIMIT', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        LOAD: ['field1', 'field2'],
        SORTBY: {
          count: 1,
          fields: [
            { field: 'score', direction: 'DESC' }
          ]
        },
        LIMIT: {
          offset: 0,
          num: 10
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'LOAD', '2', 'field1', 'field2',
          'SORTBY', '1', 'score', 'DESC', 'LIMIT', '0', '10'
        ]
      );
    });

    it('with GROUPBY and REDUCE', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        GROUPBY: {
          fields: ['@category'],
          REDUCE: {
            function: 'COUNT',
            count: 0,
            args: []
          }
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'GROUPBY', '1', '@category', 'REDUCE', 'COUNT', '0'
        ]
      );
    });

    it('with APPLY', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        APPLY: {
          expression: '@score * 2',
          AS: 'double_score'
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        ['FT.HYBRID', 'index', 'APPLY', '@score * 2', 'AS', 'double_score']
      );
    });

    it('with FILTER and post-processing', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        FILTER: '@price:[100 500]'
      });
      assert.deepEqual(
        parser.redisArgs,
        ['FT.HYBRID', 'index', 'FILTER', '@price:[100 500]']
      );
    });

    it('with PARAMS', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        PARAMS: {
          query_vector: 'BLOB_DATA',
          min_price: 100
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'PARAMS', '4', 'query_vector', 'BLOB_DATA', 'min_price', '100'
        ]
      );
    });

    it('with EXPLAINSCORE and TIMEOUT', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        EXPLAINSCORE: true,
        TIMEOUT: 5000
      });
      assert.deepEqual(
        parser.redisArgs,
        ['FT.HYBRID', 'index', 'EXPLAINSCORE', 'TIMEOUT', '5000']
      );
    });

    it('with WITHCURSOR', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        WITHCURSOR: {
          COUNT: 100,
          MAXIDLE: 300000
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index', 'WITHCURSOR', 'COUNT', '100', 'MAXIDLE', '300000'
        ]
      );
    });

    it('complete example with all options', () => {
      const parser = new BasicCommandParser();
      HYBRID.parseCommand(parser, 'index', {
        SEARCH: {
          query: '@description: bikes',
          SCORER: {
            algorithm: 'TFIDF.DOCNORM'
          },
          YIELD_SCORE_AS: 'text_score'
        },
        VSIM: {
          field: '@vector_field',
          vectorData: '$query_vector',
          method: {
            KNN: {
              K: 5
            }
          },
          YIELD_SCORE_AS: 'vector_score'
        },
        COMBINE: {
          method: {
            RRF: {
              count: 2,
              CONSTANT: 60
            }
          },
          YIELD_SCORE_AS: 'final_score'
        },
        LOAD: ['description', 'price'],
        SORTBY: {
          count: 1,
          fields: [{ field: 'final_score', direction: 'DESC' }]
        },
        LIMIT: {
          offset: 0,
          num: 10
        },
        PARAMS: {
          query_vector: 'BLOB_DATA'
        }
      });
      assert.deepEqual(
        parser.redisArgs,
        [
          'FT.HYBRID', 'index',
          'SEARCH', '@description: bikes', 'SCORER', 'TFIDF.DOCNORM', 'YIELD_SCORE_AS', 'text_score',
          'VSIM', '@vector_field', '$query_vector', 'KNN', '1', 'K', '5', 'YIELD_SCORE_AS', 'vector_score',
          'COMBINE', 'RRF', '2', 'CONSTANT', '60', 'YIELD_SCORE_AS', 'final_score',
          'LOAD', '2', 'description', 'price',
          'SORTBY', '1', 'final_score', 'DESC',
          'LIMIT', '0', '10',
          'PARAMS', '2', 'query_vector', 'BLOB_DATA'
        ]
      );
    });
  });

  // Integration tests would need to be added when RediSearch supports FT.HYBRID
  // For now, we'll skip them as this is a new command that may not be available yet
  describe.skip('client.ft.hybrid', () => {
    testUtils.testWithClient('basic hybrid search', async client => {
      // This would require a test index and data setup
      // similar to how other FT commands are tested
    }, GLOBAL.SERVERS.OPEN);
  });
});