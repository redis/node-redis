import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEARCH from './SEARCH';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DefaultDialect } from '../dialect/default';


describe('FT.SEARCH', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query'),
        ['FT.SEARCH', 'index', 'query', 'DIALECT', DefaultDialect]
      );
    });

    it('with VERBATIM', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          VERBATIM: true
        }),
        ['FT.SEARCH', 'index', 'query', 'VERBATIM', 'DIALECT', DefaultDialect]
      );
    });

    it('with NOSTOPWORDS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          NOSTOPWORDS: true
        }),
        ['FT.SEARCH', 'index', 'query', 'NOSTOPWORDS', 'DIALECT', DefaultDialect]
      );
    });

    it('with INKEYS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INKEYS: 'key'
        }),
        ['FT.SEARCH', 'index', 'query', 'INKEYS', '1', 'key', 'DIALECT', DefaultDialect]
      );
    });

    it('with INFIELDS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INFIELDS: 'field'
        }),
        ['FT.SEARCH', 'index', 'query', 'INFIELDS', '1', 'field', 'DIALECT', DefaultDialect]
      );
    });

    it('with RETURN', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          RETURN: 'return'
        }),
        ['FT.SEARCH', 'index', 'query', 'RETURN', '1', 'return', 'DIALECT', DefaultDialect]
      );
    });

    describe('with SUMMARIZE', () => {
      it('true', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: true
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'DIALECT', DefaultDialect]
        );
      });

      describe('with FIELDS', () => {
        it('string', () => {
          assert.deepEqual(
            parseArgs(SEARCH, 'index', 'query', {
              SUMMARIZE: {
                FIELDS: '@field'
              }
            }),
            ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '1', '@field', 'DIALECT', DefaultDialect]
          );
        });

        it('Array', () => {
          assert.deepEqual(
            parseArgs(SEARCH, 'index', 'query', {
              SUMMARIZE: {
                FIELDS: ['@1', '@2']
              }
            }),
            ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '2', '@1', '@2', 'DIALECT', DefaultDialect]
          );
        });
      });

      it('with FRAGS', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              FRAGS: 1
            }
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FRAGS', '1', 'DIALECT', DefaultDialect]
        );
      });

      it('with LEN', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              LEN: 1
            }
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'LEN', '1', 'DIALECT', DefaultDialect]
        );
      });

      it('with SEPARATOR', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              SEPARATOR: 'separator'
            }
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'SEPARATOR', 'separator', 'DIALECT', DefaultDialect]
        );
      });
    });

    describe('with HIGHLIGHT', () => {
      it('true', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            HIGHLIGHT: true
          }),
          ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'DIALECT', DefaultDialect]
        );
      });

      describe('with FIELDS', () => {
        it('string', () => {
          assert.deepEqual(
            parseArgs(SEARCH, 'index', 'query', {
              HIGHLIGHT: {
                FIELDS: ['@field']
              }
            }),
            ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '1', '@field', 'DIALECT', DefaultDialect]
          );
        });

        it('Array', () => {
          assert.deepEqual(
            parseArgs(SEARCH, 'index', 'query', {
              HIGHLIGHT: {
                FIELDS: ['@1', '@2']
              }
            }),
            ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '2', '@1', '@2', 'DIALECT', DefaultDialect]
          );
        });
      });

      it('with TAGS', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            HIGHLIGHT: {
              TAGS: {
                open: 'open',
                close: 'close'
              }
            }
          }),
          ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'TAGS', 'open', 'close', 'DIALECT', DefaultDialect]
        );
      });
    });

    it('with SLOP', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SLOP: 1
        }),
        ['FT.SEARCH', 'index', 'query', 'SLOP', '1', 'DIALECT', DefaultDialect]
      );
    });

    it('with TIMEOUT', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          TIMEOUT: 1
        }),
        ['FT.SEARCH', 'index', 'query', 'TIMEOUT', '1', 'DIALECT', DefaultDialect]
      );
    });

    it('with INORDER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INORDER: true
        }),
        ['FT.SEARCH', 'index', 'query', 'INORDER', 'DIALECT', DefaultDialect]
      );
    });

    it('with LANGUAGE', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          LANGUAGE: 'Arabic'
        }),
        ['FT.SEARCH', 'index', 'query', 'LANGUAGE', 'Arabic', 'DIALECT', DefaultDialect]
      );
    });

    it('with EXPANDER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          EXPANDER: 'expender'
        }),
        ['FT.SEARCH', 'index', 'query', 'EXPANDER', 'expender', 'DIALECT', DefaultDialect]
      );
    });

    it('with SCORER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SCORER: 'scorer'
        }),
        ['FT.SEARCH', 'index', 'query', 'SCORER', 'scorer', 'DIALECT', DefaultDialect]
      );
    });

    it('with SORTBY', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SORTBY: '@by'
        }),
        ['FT.SEARCH', 'index', 'query', 'SORTBY', '@by', 'DIALECT', DefaultDialect]
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          LIMIT: {
            from: 0,
            size: 1
          }
        }),
        ['FT.SEARCH', 'index', 'query', 'LIMIT', '0', '1', 'DIALECT', DefaultDialect]
      );
    });

    it('with PARAMS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          PARAMS: {
            string: 'string',
            buffer: Buffer.from('buffer'),
            number: 1
          }
        }),
        ['FT.SEARCH', 'index', 'query', 'PARAMS', '6', 'string', 'string', 'buffer', Buffer.from('buffer'), 'number', '1', 'DIALECT', DefaultDialect]
      );
    });

    it('with DIALECT', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          DIALECT: 1
        }),
        ['FT.SEARCH', 'index', 'query', 'DIALECT', '1']
      );
    });
  });

  describe('client.ft.search', () => {
    testUtils.testWithClient('without optional options', async client => {
      await Promise.all([
        client.ft.create('index', {
          field: 'TEXT'
        }),
        client.hSet('1', 'field', '1')
      ]);

      assert.deepEqual(
        await client.ft.search('index', '*'),
        {
          total: 1,
          documents: [{
            id: '1',
            value: Object.create(null, {
              field: {
                value: '1',
                configurable: true,
                enumerable: true
              }
            })
          }]
        }
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('RETURN []', async client => {
      await Promise.all([
        client.ft.create('index', {
          field: 'TEXT'
        }),
        client.hSet('1', 'field', '1'),
        client.hSet('2', 'field', '2')
      ]);

      assert.deepEqual(
        await client.ft.search('index', '*', {
          RETURN: []
        }),
        {
          total: 2,
          documents: [{
            id: '1',
            value: Object.create(null)
          }, {
            id: '2',
            value: Object.create(null)
          }]
        }
      );
    }, GLOBAL.SERVERS.OPEN);
  });
});
