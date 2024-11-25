import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEARCH from './SEARCH';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.SEARCH', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query'),
        ['FT.SEARCH', 'index', 'query']
      );
    });

    it('with VERBATIM', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          VERBATIM: true
        }),
        ['FT.SEARCH', 'index', 'query', 'VERBATIM']
      );
    });

    it('with NOSTOPWORDS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          NOSTOPWORDS: true
        }),
        ['FT.SEARCH', 'index', 'query', 'NOSTOPWORDS']
      );
    });

    it('with INKEYS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INKEYS: 'key'
        }),
        ['FT.SEARCH', 'index', 'query', 'INKEYS', '1', 'key']
      );
    });

    it('with INFIELDS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INFIELDS: 'field'
        }),
        ['FT.SEARCH', 'index', 'query', 'INFIELDS', '1', 'field']
      );
    });

    it('with RETURN', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          RETURN: 'return'
        }),
        ['FT.SEARCH', 'index', 'query', 'RETURN', '1', 'return']
      );
    });

    describe('with SUMMARIZE', () => {
      it('true', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: true
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE']
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
            ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '1', '@field']
          );
        });

        it('Array', () => {
          assert.deepEqual(
            parseArgs(SEARCH, 'index', 'query', {
              SUMMARIZE: {
                FIELDS: ['@1', '@2']
              }
            }),
            ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '2', '@1', '@2']
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
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FRAGS', '1']
        );
      });

      it('with LEN', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              LEN: 1
            }
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'LEN', '1']
        );
      });

      it('with SEPARATOR', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              SEPARATOR: 'separator'
            }
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'SEPARATOR', 'separator']
        );
      });
    });

    describe('with HIGHLIGHT', () => {
      it('true', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            HIGHLIGHT: true
          }),
          ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT']
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
            ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '1', '@field']
          );
        });

        it('Array', () => {
          assert.deepEqual(
            parseArgs(SEARCH, 'index', 'query', {
              HIGHLIGHT: {
                FIELDS: ['@1', '@2']
              }
            }),
            ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '2', '@1', '@2']
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
          ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'TAGS', 'open', 'close']
        );
      });
    });

    it('with SLOP', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SLOP: 1
        }),
        ['FT.SEARCH', 'index', 'query', 'SLOP', '1']
      );
    });

    it('with TIMEOUT', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          TIMEOUT: 1
        }),
        ['FT.SEARCH', 'index', 'query', 'TIMEOUT', '1']
      );
    });

    it('with INORDER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INORDER: true
        }),
        ['FT.SEARCH', 'index', 'query', 'INORDER']
      );
    });

    it('with LANGUAGE', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          LANGUAGE: 'Arabic'
        }),
        ['FT.SEARCH', 'index', 'query', 'LANGUAGE', 'Arabic']
      );
    });

    it('with EXPANDER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          EXPANDER: 'expender'
        }),
        ['FT.SEARCH', 'index', 'query', 'EXPANDER', 'expender']
      );
    });

    it('with SCORER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SCORER: 'scorer'
        }),
        ['FT.SEARCH', 'index', 'query', 'SCORER', 'scorer']
      );
    });

    it('with SORTBY', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SORTBY: '@by'
        }),
        ['FT.SEARCH', 'index', 'query', 'SORTBY', '@by']
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
        ['FT.SEARCH', 'index', 'query', 'LIMIT', '0', '1']
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
        ['FT.SEARCH', 'index', 'query', 'PARAMS', '6', 'string', 'string', 'buffer', Buffer.from('buffer'), 'number', '1']
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
