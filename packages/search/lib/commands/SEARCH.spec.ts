import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEARCH from './SEARCH';
import { SCHEMA_FIELD_TYPE, REDISEARCH_LANGUAGE } from './CREATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { DEFAULT_DIALECT } from '../dialect/default';
import { RESP_TYPES } from '@redis/client';

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
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          VERBATIM: true
        })),
        ['FT.SEARCH', 'index', 'query', 'VERBATIM', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with NOSTOPWORDS', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          NOSTOPWORDS: true
        })),
        ['FT.SEARCH', 'index', 'query', 'NOSTOPWORDS', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with WITHSCORES',() => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH,'index','query',{
          WITHSCORES:true
        })),
        ['FT.SEARCH','index','query','WITHSCORES','DIALECT',DEFAULT_DIALECT]
      )
    })

     it('with NOCONTENT',() => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH,'index','query',{
          NOCONTENT:true
        })),
        ['FT.SEARCH','index','query','NOCONTENT','DIALECT',DEFAULT_DIALECT]
      )
    })

     it('with WITHPAYLOADS',() => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH,'index','query',{
          WITHPAYLOADS:true
        })),
        ['FT.SEARCH','index','query','WITHPAYLOADS','DIALECT',DEFAULT_DIALECT]
      )
    })

     it('with WITHSORTKEYS',() => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH,'index','query',{
          WITHSORTKEYS:true
        })),
        ['FT.SEARCH','index','query','WITHSORTKEYS','DIALECT',DEFAULT_DIALECT]
      )
    })

      it('with FILTER (single and array)', () => {
    
    assert.deepStrictEqual(
      Array.from(parseArgs(SEARCH, 'index', 'query', {
        FILTER: { field: 'price', min: 10, max: 100 }
      })),
      ['FT.SEARCH', 'index', 'query', 'FILTER', 'price', '10', '100', 'DIALECT', DEFAULT_DIALECT]
    );

    
    assert.deepStrictEqual(
      Array.from(parseArgs(SEARCH, 'index', 'query', {
        FILTER: [
          { field: 'price', min: 10, max: 100 },
          { field: 'age', min: 18, max: 65 }
        ]
      })),
      [
        'FT.SEARCH', 'index', 'query',
        'FILTER', 'price', '10', '100',
        'FILTER', 'age', '18', '65',
        'DIALECT', DEFAULT_DIALECT
      ]
    );
  });

  it('with FILTER using Infinity bounds', () => {
  assert.deepStrictEqual(
    Array.from(parseArgs(SEARCH, 'index', 'query', {
      FILTER: { field: 'price', min: -Infinity, max: Infinity }
    })),
    ['FT.SEARCH', 'index', 'query', 'FILTER', 'price', '-inf', '+inf', 'DIALECT', DEFAULT_DIALECT]
  );
});

  it('with GEOFILTER (single and array with units)', () => {
    
    assert.deepStrictEqual(
      Array.from(parseArgs(SEARCH, 'index', 'query', {
        GEOFILTER: { field: 'location', lon: -122.4194, lat: 37.7749, radius: 10, unit: 'km' }
      })),
      ['FT.SEARCH', 'index', 'query', 'GEOFILTER', 'location', '-122.4194', '37.7749', '10', 'km', 'DIALECT', DEFAULT_DIALECT]
    );

    
    assert.deepStrictEqual(
      Array.from(parseArgs(SEARCH, 'index', 'query', {
        GEOFILTER: [
          { field: 'loc1', lon: 10, lat: 20, radius: 500, unit: 'm' },
          { field: 'loc2', lon: 30, lat: 40, radius: 50, unit: 'mi' }
        ]
      })),
      [
        'FT.SEARCH', 'index', 'query',
        'GEOFILTER', 'loc1', '10', '20', '500', 'm',
        'GEOFILTER', 'loc2', '30', '40', '50', 'mi',
        'DIALECT', DEFAULT_DIALECT
      ]
    );
  });

    it('with INKEYS', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          INKEYS: 'key'
        })),
        ['FT.SEARCH', 'index', 'query', 'INKEYS', '1', 'key', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with INFIELDS', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          INFIELDS: 'field'
        })),
        ['FT.SEARCH', 'index', 'query', 'INFIELDS', '1', 'field', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with RETURN', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          RETURN: 'return'
        })),
        ['FT.SEARCH', 'index', 'query', 'RETURN', '1', 'return', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    describe('with SUMMARIZE', () => {
      it('true', () => {
        assert.deepEqual(
          Array.from(parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: true
          })),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      describe('with FIELDS', () => {
        it('string', () => {
          assert.deepEqual(
            Array.from(parseArgs(SEARCH, 'index', 'query', {
              SUMMARIZE: {
                FIELDS: '@field'
              }
            })),
            ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '1', '@field', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('Array', () => {
          assert.deepEqual(
            Array.from(parseArgs(SEARCH, 'index', 'query', {
              SUMMARIZE: {
                FIELDS: ['@1', '@2']
              }
            })),
            ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FIELDS', '2', '@1', '@2', 'DIALECT', DEFAULT_DIALECT]
          );
        });
      });

      it('with FRAGS', () => {
        assert.deepEqual(
          Array.from(parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              FRAGS: 1
            }
          })),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'FRAGS', '1', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      it('with LEN', () => {
        assert.deepEqual(
          Array.from(parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              LEN: 1
            }
          })),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'LEN', '1', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      it('with SEPARATOR', () => {
        assert.deepEqual(
          Array.from(parseArgs(SEARCH, 'index', 'query', {
            SUMMARIZE: {
              SEPARATOR: 'separator'
            }
          })),
          ['FT.SEARCH', 'index', 'query', 'SUMMARIZE', 'SEPARATOR', 'separator', 'DIALECT', DEFAULT_DIALECT]
        );
      });
    });

    describe('with HIGHLIGHT', () => {
      it('true', () => {
        assert.deepEqual(
          Array.from(parseArgs(SEARCH, 'index', 'query', {
            HIGHLIGHT: true
          })),
          ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      describe('with FIELDS', () => {
        it('string', () => {
          assert.deepEqual(
            Array.from(parseArgs(SEARCH, 'index', 'query', {
              HIGHLIGHT: {
                FIELDS: ['@field']
              }
            })),
            ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '1', '@field', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('Array', () => {
          assert.deepEqual(
            Array.from(parseArgs(SEARCH, 'index', 'query', {
              HIGHLIGHT: {
                FIELDS: ['@1', '@2']
              }
            })),
            ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'FIELDS', '2', '@1', '@2', 'DIALECT', DEFAULT_DIALECT]
          );
        });
      });

      it('with TAGS', () => {
        assert.deepEqual(
          Array.from(parseArgs(SEARCH, 'index', 'query', {
            HIGHLIGHT: {
              TAGS: {
                open: 'open',
                close: 'close'
              }
            }
          })),
          ['FT.SEARCH', 'index', 'query', 'HIGHLIGHT', 'TAGS', 'open', 'close', 'DIALECT', DEFAULT_DIALECT]
        );
      });
    });

    it('with SLOP', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          SLOP: 1
        })),
        ['FT.SEARCH', 'index', 'query', 'SLOP', '1', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with TIMEOUT', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          TIMEOUT: 1
        })),
        ['FT.SEARCH', 'index', 'query', 'TIMEOUT', '1', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with INORDER', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          INORDER: true
        })),
        ['FT.SEARCH', 'index', 'query', 'INORDER', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with LANGUAGE', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          LANGUAGE: 'Arabic'
        })),
        ['FT.SEARCH', 'index', 'query', 'LANGUAGE', 'Arabic', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with EXPANDER', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          EXPANDER: 'expender'
        })),
        ['FT.SEARCH', 'index', 'query', 'EXPANDER', 'expender', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with SCORER', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          SCORER: 'scorer'
        })),
        ['FT.SEARCH', 'index', 'query', 'SCORER', 'scorer', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with EXPLAINSCORE', () => {
    assert.deepStrictEqual(
      Array.from(parseArgs(SEARCH, 'index', 'query', {
        WITHSCORES: true,
        EXPLAINSCORE: true
      })),
      ['FT.SEARCH', 'index', 'query', 'WITHSCORES', 'EXPLAINSCORE', 'DIALECT', DEFAULT_DIALECT]
    );
    });
  

    it('with PAYLOAD', () => {
    assert.deepStrictEqual(
      Array.from(parseArgs(SEARCH, 'index', 'query', {
        PAYLOAD: 'evaluation-payload-string'
      })),
      ['FT.SEARCH', 'index', 'query', 'PAYLOAD', 'evaluation-payload-string', 'DIALECT', DEFAULT_DIALECT]
    );
  });

    it('with SORTBY', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          SORTBY: '@by'
        })),
        ['FT.SEARCH', 'index', 'query', 'SORTBY', '@by', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          LIMIT: {
            from: 0,
            size: 1
          }
        })),
        ['FT.SEARCH', 'index', 'query', 'LIMIT', '0', '1', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with PARAMS', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          PARAMS: {
            string: 'string',
            buffer: Buffer.from('buffer'),
            number: 1
          }
        })),
        ['FT.SEARCH', 'index', 'query', 'PARAMS', '6', 'string', 'string', 'buffer', Buffer.from('buffer'), 'number', '1', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with DIALECT', () => {
      assert.deepEqual(
        Array.from(parseArgs(SEARCH, 'index', 'query', {
          DIALECT: 1
        })),
        ['FT.SEARCH', 'index', 'query', 'DIALECT', '1']
      );
    });

    it('stores the options for use by transformReply', () => {
    const options = { WITHSCORES: true, NOCONTENT: true };
    const args = parseArgs(SEARCH, 'index', 'query', options);
    assert.deepEqual(args.preserve, options);
  });
  });

  describe('transformReply', () => {
    it('RESP2 reply has empty warnings', () => {
      assert.deepEqual(
        SEARCH.transformReply[2]([0]),
        { total: 0, documents: [], warnings: [] }
      );
    });

    it('RESP3 reply populates warnings from the `warning` field', () => {
      const reply = new Map<string, unknown>([
        ['total_results', 0],
        ['results', []],
        ['warning', ['Timeout limit was reached']]
      ]);

      assert.deepEqual(
        SEARCH.transformReply[3](reply),
        { total: 0, documents: [], warnings: ['Timeout limit was reached'] }
      );
    });

    it('RESP3 reply without a `warning` field yields empty warnings', () => {
      const reply = new Map<string, unknown>([
        ['total_results', 0],
        ['results', []]
      ]);

      assert.deepEqual(
        SEARCH.transformReply[3](reply),
        { total: 0, documents: [], warnings: [] }
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
          }],
          warnings: []
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
          }],
          warnings: []
        }
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('EXPLAINSCORE', async client => {
      await Promise.all([
      client.ft.create('index', { field: 'TEXT' }),
      client.hSet('1', 'field', 'hello world')
    ]);

    const res = await client.ft.search('index', 'hello', {
      WITHSCORES: true,
      EXPLAINSCORE: true
    });

    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.documents.length, 1);
    assert.strictEqual(res.documents[0].id, '1');
    assert.strictEqual(typeof res.documents[0].score, 'number');
    assert.ok(Array.isArray(res.documents[0].scoreExplain));
    assert.ok(res.documents[0].scoreExplain.length > 0);
  }, GLOBAL.SERVERS.OPEN);

     testUtils.testWithClient('WITHSCORES', async client => {
      await Promise.all([
        client.ft.create('index', {
          field: 'TEXT'
        }),
        client.hSet('1', 'field', '1')
      ]);

      const res = await client.ft.search('index','*',{WITHSCORES: true});
      
      assert.strictEqual(res.total,1);
      assert.strictEqual(res.documents.length,1);
      assert.strictEqual(res.documents[0].id,'1');
      assert.strictEqual(typeof res.documents[0].score,'number');
      
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('NOCONTENT', async client => {
    await Promise.all([
      client.ft.create('index', { field: 'TEXT' }),
      client.hSet('1', 'field', 'hello world')
    ]);

    const res = await client.ft.search('index', '*', { NOCONTENT: true });

    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.documents.length, 1);
    assert.strictEqual(res.documents[0].id, '1');
    assert.deepStrictEqual(res.documents[0].value, {});
  }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('WITHPAYLOADS', async client => {
    await Promise.all([
      client.ft.create('index', { field: 'TEXT' }),
      client.hSet('1', 'field', 'hello world')
    ]);

    const res = await client.ft.search('index', '*', {
      WITHPAYLOADS: true
    });

    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.documents.length, 1);
    assert.strictEqual(res.documents[0].id, '1');
    assert.strictEqual(res.documents[0].payload, undefined);
    assert.deepStrictEqual(res.documents[0].value, { field: 'hello world' });
  }, GLOBAL.SERVERS.OPEN);


  testUtils.testWithClient('WITHSORTKEYS', async client => {
    await Promise.all([
      client.ft.create('index', {
        field: { type: 'TEXT', SORTABLE: true }
      }),
      client.hSet('1', 'field', 'hello world')
    ]);

    const res = await client.ft.search('index', '*', {
      SORTBY: 'field',
      WITHSORTKEYS: true
    });

    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.documents.length, 1);
    assert.strictEqual(res.documents[0].id, '1');
    assert.strictEqual(typeof res.documents[0].sortKey, 'string');
    assert.deepStrictEqual(res.documents[0].value, { field: 'hello world' });
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('WITHSCORES + NOCONTENT', async client => {
    await Promise.all([
      client.ft.create('index', { field: 'TEXT' }),
      client.hSet('101', 'field', 'numeric id test')
    ]);

    const res = await client.ft.search('index', '*', {
      WITHSCORES: true,
      NOCONTENT: true
    });

    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.documents.length, 1);
    assert.strictEqual(res.documents[0].id, '101');
    assert.strictEqual(typeof res.documents[0].score, 'number');
    assert.deepStrictEqual(res.documents[0].value, {});
  }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('FILTER', async client => {
    await Promise.all([
      client.ft.create('index', {
        price: { type: 'NUMERIC' }
      }),
      client.hSet('doc:1', 'price', '15'),
      client.hSet('doc:2', 'price', '50'),
      client.hSet('doc:3', 'price', '120')
    ]);

    const res = await client.ft.search('index', '*', {
      FILTER: { field: 'price', min: 10, max: 100 }
    });

    assert.strictEqual(res.total, 2);
    assert.strictEqual(res.documents.length, 2);
    const ids = res.documents.map(d => d.id).sort();
    assert.deepStrictEqual(ids, ['doc:1', 'doc:2']);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('GEOFILTER', async client => {
    await Promise.all([
      client.ft.create('index', {
        location: { type: 'GEO' }
      }),
      
      client.hSet('doc:sf', 'location', '-122.4194,37.7749'),
      client.hSet('doc:oakland', 'location', '-122.2711,37.8044')
    ]);

    
    const res = await client.ft.search('index', '*', {
      GEOFILTER: {
        field: 'location',
        lon: -122.4194,
        lat: 37.7749,
        radius: 5,
        unit: 'km'
      }
    });

    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.documents[0].id, 'doc:sf');
  }, GLOBAL.SERVERS.OPEN);


    testUtils.testWithClient('PAYLOAD', async client => {
    await Promise.all([
      client.ft.create('index', { field: 'TEXT' }),
      client.hSet('1', 'field', 'hello world')
    ]);

    const res = await client.ft.search('index', '*', {
      PAYLOAD: 'custom-eval-context'
    });

    assert.strictEqual(res.total, 1);
    assert.strictEqual(res.documents[0].id, '1');
    assert.strictEqual(res.documents[0].payload, undefined); 
    assert.deepStrictEqual(res.documents[0].value, { field: 'hello world' });
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

  testUtils.testWithClient('NOCONTENT takes precedence over a conflicting RETURN', async client => {
  await Promise.all([
    client.ft.create('index', { title: 'TEXT', price: 'NUMERIC' }),
    client.hSet('1', { title: 'Widget', price: '9.99' })
  ]);
  const res = await client.ft.search('index', '*', {
    NOCONTENT: true,
    RETURN: ['title', 'price']
  });
  assert.strictEqual(res.total, 1);
  assert.deepStrictEqual(res.documents[0].value, {});
}, GLOBAL.SERVERS.OPEN);

  
  testUtils.testWithClient('WITHSORTKEYS honors BLOB_STRING', async client => {
  await Promise.all([
    client.ft.create('index', { field: { type: 'TEXT', SORTABLE: true } }),
    client.hSet('1', 'field', 'hello world')
  ]);
  const res = await client
    .withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer })
    .ft.search('index', '*', { SORTBY: 'field', WITHSORTKEYS: true });
  assert.ok(Buffer.isBuffer(res.documents[0].sortKey));
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
      // Indonesian stemmer reduces "membaca" to the root "baca"
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
