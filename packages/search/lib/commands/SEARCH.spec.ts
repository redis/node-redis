import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEARCH from './SEARCH';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DEFAULT_DIALECT } from '../dialect/default';


describe('FT.SEARCH', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query'),
        ['FT.SEARCH', 'index', 'query', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with VERBATIM', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          VERBATIM: true
        }),
        ['FT.SEARCH', 'index', 'query', 'VERBATIM', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with NOSTOPWORDS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          NOSTOPWORDS: true
        }),
        ['FT.SEARCH', 'index', 'query', 'NOSTOPWORDS', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with INKEYS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INKEYS: 'key'
        }),
        ['FT.SEARCH', 'index', 'query', 'INKEYS', '1', 'key', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with INFIELDS', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INFIELDS: 'field'
        }),
        ['FT.SEARCH', 'index', 'query', 'INFIELDS', '1', 'field', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with RETURN', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          RETURN: 'return'
        }),
        ['FT.SEARCH', 'index', 'query', 'RETURN', '1', 'return', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    describe('with SUMMARIZE', () => {
      it('true', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: true
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'DIALECT', DEFAULT_DIALECT]
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
            ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '1', '@field', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('Array', () => {
          assert.deepEqual(
            parseArgs(SEARCH, 'index', 'query', {
              SUMMARIZE: {
                FIELDS: ['@1', '@2']
              }
            }),
            ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '2', '@1', '@2', 'DIALECT', DEFAULT_DIALECT]
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
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FRAGS', '1', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      it('with LEN', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              LEN: 1
            }
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'LEN', '1', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      it('with SEPARATOR', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              SEPARATOR: 'separator'
            }
          }),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'SEPARATOR', 'separator', 'DIALECT', DEFAULT_DIALECT]
        );
      });
    });

    describe('with HIGHLIGHT', () => {
      it('true', () => {
        assert.deepEqual(
          parseArgs(SEARCH, 'index', 'query', {
            HIGHLIGHT: true
          }),
          ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'DIALECT', DEFAULT_DIALECT]
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
            ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '1', '@field', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('Array', () => {
          assert.deepEqual(
            parseArgs(SEARCH, 'index', 'query', {
              HIGHLIGHT: {
                FIELDS: ['@1', '@2']
              }
            }),
            ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '2', '@1', '@2', 'DIALECT', DEFAULT_DIALECT]
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
          ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'TAGS', 'open', 'close', 'DIALECT', DEFAULT_DIALECT]
        );
      });
    });

    it('with SLOP', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SLOP: 1
        }),
        ['FT.SEARCH', 'index', 'query', 'SLOP', '1', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with TIMEOUT', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          TIMEOUT: 1
        }),
        ['FT.SEARCH', 'index', 'query', 'TIMEOUT', '1', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with INORDER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          INORDER: true
        }),
        ['FT.SEARCH', 'index', 'query', 'INORDER', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with LANGUAGE', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          LANGUAGE: 'Arabic'
        }),
        ['FT.SEARCH', 'index', 'query', 'LANGUAGE', 'Arabic', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with EXPANDER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          EXPANDER: 'expender'
        }),
        ['FT.SEARCH', 'index', 'query', 'EXPANDER', 'expender', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with SCORER', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SCORER: 'scorer'
        }),
        ['FT.SEARCH', 'index', 'query', 'SCORER', 'scorer', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with SORTBY', () => {
      assert.deepEqual(
        parseArgs(SEARCH, 'index', 'query', {
          SORTBY: '@by'
        }),
        ['FT.SEARCH', 'index', 'query', 'SORTBY', '@by', 'DIALECT', DEFAULT_DIALECT]
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
        ['FT.SEARCH', 'index', 'query', 'LIMIT', '0', '1', 'DIALECT', DEFAULT_DIALECT]
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
        ['FT.SEARCH', 'index', 'query', 'PARAMS', '6', 'string', 'string', 'buffer', Buffer.from('buffer'), 'number', '1', 'DIALECT', DEFAULT_DIALECT]
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

    testUtils.testWithClient('properly parse content/nocontent scenarios', async client => {

      const indexName = 'foo';
      await client.ft.create(
        indexName,
        {
          itemOrder: {
            type: 'NUMERIC',
            SORTABLE: true,
          },
          name: {
            type: 'TEXT',
          },
        },
        {
          ON: 'HASH',
          PREFIX: 'item:',
        }
      );

      await client.hSet("item:1", {
        itemOrder: 1,
        name: "First item",
      });

      await client.hSet("item:2", {
        itemOrder: 2,
        name: "Second item",
      });

      await client.hSet("item:3", {
        itemOrder: 3,
        name: "Third item",
      });

      // Search with SORTBY and LIMIT
      let result = await client.ft.search(indexName, "@itemOrder:[0 10]", {
        SORTBY: {
          BY: "itemOrder",
          DIRECTION: "ASC",
        },
        LIMIT: {
          from: 0,
          size: 1, // only get first result
        },
      });

      assert.equal(result.total, 3, "Result's `total` value reflects the total scanned documents");
      assert.equal(result.documents.length, 1);
      let doc = result.documents[0];
      assert.equal(doc.id, 'item:1');
      assert.equal(doc.value.itemOrder, '1');
      assert.equal(doc.value.name, 'First item');

       await client.del("item:3");

       // Search again after removing item:3
       result = await client.ft.search(indexName, "@itemOrder:[0 10]", {
         SORTBY: {
           BY: "itemOrder",
           DIRECTION: "ASC",
         },
         LIMIT: {
           from: 0,
           size: 1, // only get first result
         },
       });

       assert.equal(result.total, 2, "Result's `total` value reflects the total scanned documents");
       assert.equal(result.documents.length, 1);
       doc = result.documents[0];
       assert.equal(doc.id, 'item:1');
       assert.equal(doc.value.itemOrder, '1');
       assert.equal(doc.value.name, 'First item');


    }, GLOBAL.SERVERS.OPEN);

  });
});
