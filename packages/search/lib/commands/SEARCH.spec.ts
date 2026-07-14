import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEARCH from './SEARCH';
import { SCHEMA_FIELD_TYPE, REDISEARCH_LANGUAGE } from './CREATE';
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
            value: Object.defineProperties({}, {
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
            value: {}
          }, {
            id: '2',
            value: {}
          }]
        }
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('with data', async client => {
      await Promise.all([
        client.ft.create('index', {
          field: 'TEXT'
        }),
        client.hSet('1', 'field', '1')
      ]);

      const reply = await client.ft.search('index', '*');

      // Transformed reply has { total, documents }
      assert.ok(reply !== null && typeof reply === 'object');
      assert.equal(typeof reply.total, 'number');
      assert.equal(reply.total, 1);
      assert.ok(Array.isArray(reply.documents));
      assert.equal(reply.documents.length, 1);
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

  describe('non-English languages', () => {
    // Each case: a document whose text contains an inflected word, and a query
    // for a different inflection of the same word. The match only succeeds when
    // the index is built with the matching language's Snowball stemmer; the
    // English stemmer leaves the two forms distinct.
    const STEMMING_CASES = [
      { language: REDISEARCH_LANGUAGE.GERMAN, text: 'Die Kinder spielen im Garten', query: 'Kind' },
      { language: REDISEARCH_LANGUAGE.FRENCH, text: 'Les chevaux courent vite', query: 'cheval' },
      { language: REDISEARCH_LANGUAGE.SPANISH, text: 'Nosotros hablamos mucho', query: 'hablar' },
      { language: REDISEARCH_LANGUAGE.GREEK, text: 'Οι άνθρωποι περπατούν', query: 'άνθρωπος' },
      // Indonesian stemmer reduces "membaca" to the root "baca" (since 8.9.0)
      { language: REDISEARCH_LANGUAGE.INDONESAIN, text: 'Saya sedang membaca buku', query: 'baca' }
    ];

    for (const { language, text, query } of STEMMING_CASES) {
      testUtils.testWithClient(`stemming with LANGUAGE ${language}`, async client => {
        await Promise.all([
          client.ft.create('lang', { content: SCHEMA_FIELD_TYPE.TEXT }, { LANGUAGE: language }),
          client.ft.create('en', { content: SCHEMA_FIELD_TYPE.TEXT }, { LANGUAGE: REDISEARCH_LANGUAGE.ENGLISH }),
          client.hSet('doc', 'content', text)
        ]);

        // language-specific stemmer reduces both inflections to the same stem
        assert.equal(
          (await client.ft.search('lang', query)).total,
          1,
          `${language} stemmer should match "${query}" against "${text}"`
        );

        // explicit query-time LANGUAGE is accepted and yields the same match
        assert.equal(
          (await client.ft.search('lang', query, { LANGUAGE: language })).total,
          1,
          `query-time LANGUAGE ${language} should match "${query}"`
        );

        // English stemmer keeps the inflections distinct, so no match
        assert.equal(
          (await client.ft.search('en', query)).total,
          0,
          `English stemmer should not match "${query}" against "${text}"`
        );
      }, GLOBAL.SERVERS.OPEN);
    }

    testUtils.testWithClient('Chinese tokenization', async client => {
      await Promise.all([
        client.ft.create('zh', { content: SCHEMA_FIELD_TYPE.TEXT }, { LANGUAGE: REDISEARCH_LANGUAGE.CHINESE }),
        client.ft.create('en', { content: SCHEMA_FIELD_TYPE.TEXT }),
        client.hSet('doc', 'content', '我喜欢编程')
      ]);

      // friso tokenizer segments "我喜欢编程", so the sub-term "编程" matches
      assert.equal(
        (await client.ft.search('zh', '编程')).total,
        1
      );

      // without Chinese tokenization the un-segmented text does not match
      assert.equal(
        (await client.ft.search('en', '编程')).total,
        0
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('per-document LANGUAGE_FIELD', async client => {
      await client.ft.create('idx', { content: SCHEMA_FIELD_TYPE.TEXT }, {
        LANGUAGE_FIELD: '__lang'
      });

      await Promise.all([
        client.hSet('de', { content: 'Die Kinder spielen im Garten', __lang: REDISEARCH_LANGUAGE.GERMAN }),
        client.hSet('fr', { content: 'Les chevaux courent vite', __lang: REDISEARCH_LANGUAGE.FRENCH })
      ]);

      // each document is stemmed with its own language
      assert.deepEqual(
        (await client.ft.search('idx', 'Kind')).documents.map(d => d.id),
        ['de']
      );
      assert.deepEqual(
        (await client.ft.search('idx', 'cheval')).documents.map(d => d.id),
        ['fr']
      );
    }, GLOBAL.SERVERS.OPEN);
  });
});
