import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import AGGREGATE from './AGGREGATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { RESP_TYPES } from '@redis/client';
import { DEFAULT_DIALECT } from '../dialect/default';

describe('AGGREGATE', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*'),
        ['FT.AGGREGATE', 'index', '*', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with VERBATIM', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*', {
          VERBATIM: true
        }),
        ['FT.AGGREGATE', 'index', '*', 'VERBATIM', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with ADDSCORES', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*', { ADDSCORES: true }),
        ['FT.AGGREGATE', 'index', '*', 'ADDSCORES', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    describe('with LOAD', () => {
      it('all attributes (*)', () => {
        assert.deepEqual(
          parseArgs(AGGREGATE, 'index', '*', {
            LOAD: '*'
          }),
          ['FT.AGGREGATE', 'index', '*', 'LOAD', '*', 'DIALECT', DEFAULT_DIALECT]
        );
      });
      describe('single', () => {
        describe('without alias', () => {
          it('string', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                LOAD: '@property'
              }),
              ['FT.AGGREGATE', 'index', '*', 'LOAD', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('{ identifier: string }', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                LOAD: {
                  identifier: '@property'
                }
              }),
              ['FT.AGGREGATE', 'index', '*', 'LOAD', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
            );
          });
        });

        it('with alias', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              LOAD: {
                identifier: '@property',
                AS: 'alias'
              }
            }),
            ['FT.AGGREGATE', 'index', '*', 'LOAD', '3', '@property', 'AS', 'alias', 'DIALECT', DEFAULT_DIALECT]
          );
        });
      });

      it('multiple', () => {
        assert.deepEqual(
          parseArgs(AGGREGATE, 'index', '*', {
            LOAD: ['@1', '@2']
          }),
          ['FT.AGGREGATE', 'index', '*', 'LOAD', '2', '@1', '@2', 'DIALECT', DEFAULT_DIALECT]
        );
      });
    });

    describe('with STEPS', () => {
      describe('GROUPBY', () => {
        describe('COUNT', () => {
          describe('without properties', () => {
            it('without alias', () => {
              assert.deepEqual(
                parseArgs(AGGREGATE, 'index', '*', {
                  STEPS: [{
                    type: 'GROUPBY',
                    REDUCE: {
                      type: 'COUNT'
                    }
                  }]
                }),
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT', '0', 'DIALECT', DEFAULT_DIALECT]
              );
            });

            it('with alias', () => {
              assert.deepEqual(
                parseArgs(AGGREGATE, 'index', '*', {
                  STEPS: [{
                    type: 'GROUPBY',
                    REDUCE: {
                      type: 'COUNT',
                      AS: 'count'
                    }
                  }]
                }),
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT', '0', 'AS', 'count', 'DIALECT', DEFAULT_DIALECT]
              );
            });
          });

          describe('with properties', () => {
            it('single', () => {
              assert.deepEqual(
                parseArgs(AGGREGATE, 'index', '*', {
                  STEPS: [{
                    type: 'GROUPBY',
                    properties: '@property',
                    REDUCE: {
                      type: 'COUNT'
                    }
                  }]
                }),
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '1', '@property', 'REDUCE', 'COUNT', '0', 'DIALECT', DEFAULT_DIALECT]
              );
            });

            it('multiple', () => {
              assert.deepEqual(
                parseArgs(AGGREGATE, 'index', '*', {
                  STEPS: [{
                    type: 'GROUPBY',
                    properties: ['@1', '@2'],
                    REDUCE: {
                      type: 'COUNT'
                    }
                  }]
                }),
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '2', '@1', '@2', 'REDUCE', 'COUNT', '0', 'DIALECT', DEFAULT_DIALECT]
              );
            });
          });
        });

        it('COUNT_DISTINCT', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'COUNT_DISTINCT',
                  property: '@property'
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT_DISTINCT', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('COUNT_DISTINCTISH', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'COUNT_DISTINCTISH',
                  property: '@property'
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT_DISTINCTISH', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('SUM', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'SUM',
                  property: '@property'
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'SUM', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('MIN', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'MIN',
                  property: '@property'
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'MIN', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('MAX', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'MAX',
                  property: '@property'
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'MAX', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('AVG', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'AVG',
                  property: '@property'
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'AVG', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
          );
        });
        it('STDDEV', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'STDDEV',
                  property: '@property'
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'STDDEV', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('QUANTILE', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'QUANTILE',
                  property: '@property',
                  quantile: 0.5
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'QUANTILE', '2', '@property', '0.5', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('TOLIST', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'TOLIST',
                  property: '@property'
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'TOLIST', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        describe('FIRST_VALUE', () => {
          it('simple', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  REDUCE: {
                    type: 'FIRST_VALUE',
                    property: '@property'
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '1', '@property', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          describe('with BY', () => {
            describe('without direction', () => {
              it('string', () => {
                assert.deepEqual(
                  parseArgs(AGGREGATE, 'index', '*', {
                    STEPS: [{
                      type: 'GROUPBY',
                      REDUCE: {
                        type: 'FIRST_VALUE',
                        property: '@property',
                        BY: '@by'
                      }
                    }]
                  }),
                  ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '3', '@property', 'BY', '@by', 'DIALECT', DEFAULT_DIALECT]
                );
              });


              it('{ property: string }', () => {
                assert.deepEqual(
                  parseArgs(AGGREGATE, 'index', '*', {
                    STEPS: [{
                      type: 'GROUPBY',
                      REDUCE: {
                        type: 'FIRST_VALUE',
                        property: '@property',
                        BY: {
                          property: '@by'
                        }
                      }
                    }]
                  }),
                  ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '3', '@property', 'BY', '@by', 'DIALECT', DEFAULT_DIALECT]
                );
              });
            });

            it('with direction', () => {
              assert.deepEqual(
                parseArgs(AGGREGATE, 'index', '*', {
                  STEPS: [{
                    type: 'GROUPBY',
                    REDUCE: {
                      type: 'FIRST_VALUE',
                      property: '@property',
                      BY: {
                        property: '@by',
                        direction: 'ASC'
                      }
                    }
                  }]
                }),
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '4', '@property', 'BY', '@by', 'ASC', 'DIALECT', DEFAULT_DIALECT]
              );
            });
          });
        });

        it('RANDOM_SAMPLE', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'GROUPBY',
                REDUCE: {
                  type: 'RANDOM_SAMPLE',
                  property: '@property',
                  sampleSize: 1
                }
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'RANDOM_SAMPLE', '2', '@property', '1', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        describe('COLLECT', () => {
          it('FIELDS *', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: '*'
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COLLECT', '2', 'FIELDS', '*', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('FIELDS single field', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: '@field'
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COLLECT', '3', 'FIELDS', '1', '@field', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('FIELDS array', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: ['@a', '@b']
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COLLECT', '4', 'FIELDS', '2', '@a', '@b', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('with DISTINCT', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: '*',
                    DISTINCT: true
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COLLECT', '3', 'FIELDS', '*', 'DISTINCT', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('with SORTBY string', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: '*',
                    SORTBY: '@field'
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COLLECT', '5', 'FIELDS', '*', 'SORTBY', '1', '@field', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('with SORTBY array and directions', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: '*',
                    SORTBY: [
                      { BY: '@target', DIRECTION: 'DESC' },
                      { BY: '@bestByDate', DIRECTION: 'ASC' }
                    ]
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COLLECT', '8', 'FIELDS', '*', 'SORTBY', '4', '@target', 'DESC', '@bestByDate', 'ASC', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('with LIMIT', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: '*',
                    LIMIT: { from: 0, size: 5 }
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COLLECT', '5', 'FIELDS', '*', 'LIMIT', '0', '5', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('movies-by-genre example (narg 9)', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  properties: '@genre',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: '*',
                    SORTBY: { BY: '@rating', DIRECTION: 'DESC' },
                    LIMIT: { from: 0, size: 5 },
                    AS: 'top_movies'
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '1', '@genre', 'REDUCE', 'COLLECT', '9', 'FIELDS', '*', 'SORTBY', '2', '@rating', 'DESC', 'LIMIT', '0', '5', 'AS', 'top_movies', 'DIALECT', DEFAULT_DIALECT]
            );
          });

          it('relationships example (narg 12, DISTINCT)', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                STEPS: [{
                  type: 'GROUPBY',
                  properties: '@relationshipName',
                  REDUCE: {
                    type: 'COLLECT',
                    FIELDS: '*',
                    DISTINCT: true,
                    SORTBY: [
                      { BY: '@target', DIRECTION: 'DESC' },
                      { BY: '@bestByDate', DIRECTION: 'ASC' }
                    ],
                    LIMIT: { from: 0, size: 3 },
                    AS: 'all_distinct_docs'
                  }
                }]
              }),
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '1', '@relationshipName', 'REDUCE', 'COLLECT', '12', 'FIELDS', '*', 'DISTINCT', 'SORTBY', '4', '@target', 'DESC', '@bestByDate', 'ASC', 'LIMIT', '0', '3', 'AS', 'all_distinct_docs', 'DIALECT', DEFAULT_DIALECT]
            );
          });
        });
      });

      describe('SORTBY', () => {
        it('string', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'SORTBY',
                BY: '@by'
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'SORTBY', '1', '@by', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('Array', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'SORTBY',
                BY: ['@1', '@2']
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'SORTBY', '2', '@1', '@2', 'DIALECT', DEFAULT_DIALECT]
          );
        });

        it('with MAX', () => {
          assert.deepEqual(
            parseArgs(AGGREGATE, 'index', '*', {
              STEPS: [{
                type: 'SORTBY',
                BY: '@by',
                MAX: 1
              }]
            }),
            ['FT.AGGREGATE', 'index', '*', 'SORTBY', '3', '@by', 'MAX', '1', 'DIALECT', DEFAULT_DIALECT]
          );
        });
      });

      describe('APPLY', () => {
        assert.deepEqual(
          parseArgs(AGGREGATE, 'index', '*', {
            STEPS: [{
              type: 'APPLY',
              expression: '@field + 1',
              AS: 'as'
            }]
          }),
          ['FT.AGGREGATE', 'index', '*', 'APPLY', '@field + 1', 'AS', 'as', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      describe('LIMIT', () => {
        assert.deepEqual(
          parseArgs(AGGREGATE, 'index', '*', {
            STEPS: [{
              type: 'LIMIT',
              from: 0,
              size: 1
            }]
          }),
          ['FT.AGGREGATE', 'index', '*', 'LIMIT', '0', '1', 'DIALECT', DEFAULT_DIALECT]
        );
      });

      describe('FILTER', () => {
        assert.deepEqual(
          parseArgs(AGGREGATE, 'index', '*', {
            STEPS: [{
              type: 'FILTER',
              expression: '@field != ""'
            }]
          }),
          ['FT.AGGREGATE', 'index', '*', 'FILTER', '@field != ""', 'DIALECT', DEFAULT_DIALECT]
        );
      });
    });

    it('with PARAMS', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*', {
          PARAMS: {
            param: 'value'
          }
        }),
        ['FT.AGGREGATE', 'index', '*', 'PARAMS', '2', 'param', 'value', 'DIALECT', DEFAULT_DIALECT]
      );
    });

    it('with DIALECT', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*', {
          DIALECT: 1
        }),
        ['FT.AGGREGATE', 'index', '*', 'DIALECT', '1']
      );
    });

    it('with TIMEOUT', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*', { TIMEOUT: 10 }),
        ['FT.AGGREGATE', 'index', '*', 'TIMEOUT', '10', 'DIALECT', DEFAULT_DIALECT]
      );
    });
  });

  testUtils.testWithClient('client.ft.aggregate', async client => {
    await client.ft.create('index', {
      field: 'NUMERIC'
    });
    await client.hSet('1', 'field', '1');
    await client.hSet('2', 'field', '2');

    assert.deepEqual(
      await client.ft.aggregate('index', '*', {
        STEPS: [{
          type: 'GROUPBY',
          REDUCE: [{
            type: 'SUM',
            property: '@field',
            AS: 'sum'
          }, {
            type: 'AVG',
            property: '@field',
            AS: 'avg'
          }]
        }]
      }),
      {
        total: 1,
        results: [
          Object.defineProperties({}, {
            sum: {
              value: '3',
              configurable: true,
              enumerable: true
            },
            avg: {
              value: '1.5',
              configurable: true,
              enumerable: true
            }
          })
        ]
      }
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.aggregate with data', async client => {
    await client.ft.create('index', {
      field: 'NUMERIC'
    });
    await client.hSet('1', 'field', '1');
    await client.hSet('2', 'field', '2');

    const reply = await client.ft.aggregate('index', '*', {
      STEPS: [{
        type: 'GROUPBY',
        REDUCE: [{
          type: 'SUM',
          property: '@field',
          AS: 'sum'
        }, {
          type: 'AVG',
          property: '@field',
          AS: 'avg'
        }]
      }]
    });

    // RESP3 returns a Map reply with structured fields instead of a flat Array
    assert.ok(reply !== null && typeof reply === 'object');
    assert.ok('results' in reply);
    assert.ok(Array.isArray(reply.results));
    assert.ok(reply.results.length > 0);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ft.aggregate with RESP_TYPES.MAP: Array typeMapping', async client => {
    await client.ft.create('index', {
      field: 'NUMERIC'
    });
    await client.hSet('1', 'field', '1');
    await client.hSet('2', 'field', '2');

    const reply = await client.ft.aggregate('index', '*', {
      STEPS: [{
        type: 'GROUPBY',
        REDUCE: [{
          type: 'SUM',
          property: '@field',
          AS: 'sum'
        }, {
          type: 'AVG',
          property: '@field',
          AS: 'avg'
        }]
      }]
    });

    assert.strictEqual(reply.total, 1);
    assert.ok(Array.isArray(reply.results));
    assert.strictEqual(reply.results.length, 1);

    const firstResult = reply.results[0] as unknown as Array<unknown>;
    assert.ok(Array.isArray(firstResult), 'each result row should be a flat [k,v,...] array under MAP=Array');

    const obj: Record<string, unknown> = {};
    for (let i = 0; i < firstResult.length; i += 2) {
      obj[String(firstResult[i])] = firstResult[i + 1];
    }
    assert.strictEqual(String(obj.sum), '3');
    assert.strictEqual(String(obj.avg), '1.5');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      commandOptions: {
        typeMapping: {
          [RESP_TYPES.MAP]: Array
        }
      }
    }
  });

  testUtils.testWithClient('client.ft.aggregate with COLLECT reducer', async client => {
    await client.ft.create('index', {
      genre: 'TAG',
      rating: 'NUMERIC'
    });
    await client.hSet('movie:1', { genre: 'action', rating: '8' });
    await client.hSet('movie:2', { genre: 'action', rating: '9' });
    await client.hSet('movie:3', { genre: 'drama', rating: '7' });

    const reply = await client.ft.aggregate('index', '*', {
      LOAD: '*',
      STEPS: [{
        type: 'GROUPBY',
        properties: '@genre',
        REDUCE: {
          type: 'COLLECT',
          FIELDS: '*',
          SORTBY: { BY: '@rating', DIRECTION: 'DESC' },
          LIMIT: { from: 0, size: 5 },
          AS: 'top_movies'
        }
      }]
    });

    assert.ok(reply !== null && typeof reply === 'object');
    assert.ok(Array.isArray(reply.results));
    assert.ok(reply.results.length > 0);
    // Each group exposes the COLLECT alias holding an array of per-document maps
    for (const group of reply.results) {
      assert.ok('top_movies' in group);
      assert.ok(Array.isArray((group as Record<string, unknown>).top_movies));
    }
  }, { ...GLOBAL.SERVERS.OPEN_UNSTABLE, minimumDockerVersion: [8, 8] });
});
