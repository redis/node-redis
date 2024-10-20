import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import AGGREGATE from './AGGREGATE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('AGGREGATE', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*'),
        ['FT.AGGREGATE', 'index', '*']
      );
    });

    it('with VERBATIM', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*', {
          VERBATIM: true
        }),
        ['FT.AGGREGATE', 'index', '*', 'VERBATIM']
      );
    });

    it('with ADDSCORES', () => {
      assert.deepEqual(
        parseArgs(AGGREGATE, 'index', '*', { ADDSCORES: true }),
        ['FT.AGGREGATE', 'index', '*', 'ADDSCORES']
      );
    });  

    describe('with LOAD', () => {
      describe('single', () => {
        describe('without alias', () => {
          it('string', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                LOAD: '@property'
              }),
              ['FT.AGGREGATE', 'index', '*', 'LOAD', '1', '@property']
            );
          });

          it('{ identifier: string }', () => {
            assert.deepEqual(
              parseArgs(AGGREGATE, 'index', '*', {
                LOAD: {
                  identifier: '@property'
                }
              }),
              ['FT.AGGREGATE', 'index', '*', 'LOAD', '1', '@property']
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
            ['FT.AGGREGATE', 'index', '*', 'LOAD', '3', '@property', 'AS', 'alias']
          );
        });
      });

      it('multiple', () => {
        assert.deepEqual(
          parseArgs(AGGREGATE, 'index', '*', {
            LOAD: ['@1', '@2']
          }),
          ['FT.AGGREGATE', 'index', '*', 'LOAD', '2', '@1', '@2']
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
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT', '0']
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
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT', '0', 'AS', 'count']
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
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '1', '@property', 'REDUCE', 'COUNT', '0']
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
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '2', '@1', '@2', 'REDUCE', 'COUNT', '0']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT_DISTINCT', '1', '@property']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'COUNT_DISTINCTISH', '1', '@property']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'SUM', '1', '@property']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'MIN', '1', '@property']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'MAX', '1', '@property']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'AVG', '1', '@property']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'STDDEV', '1', '@property']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'QUANTILE', '2', '@property', '0.5']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'TOLIST', '1', '@property']
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
              ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '1', '@property']
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
                  ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '3', '@property', 'BY', '@by']
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
                  ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '3', '@property', 'BY', '@by']
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
                ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'FIRST_VALUE', '4', '@property', 'BY', '@by', 'ASC']
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
            ['FT.AGGREGATE', 'index', '*', 'GROUPBY', '0', 'REDUCE', 'RANDOM_SAMPLE', '2', '@property', '1']
          );
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
            ['FT.AGGREGATE', 'index', '*', 'SORTBY', '1', '@by']
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
            ['FT.AGGREGATE', 'index', '*', 'SORTBY', '2', '@1', '@2']
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
            ['FT.AGGREGATE', 'index', '*', 'SORTBY', '3', '@by', 'MAX', '1']
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
          ['FT.AGGREGATE', 'index', '*', 'APPLY', '@field + 1', 'AS', 'as']
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
          ['FT.AGGREGATE', 'index', '*', 'LIMIT', '0', '1']
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
          ['FT.AGGREGATE', 'index', '*', 'FILTER', '@field != ""']
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
        ['FT.AGGREGATE', 'index', '*', 'PARAMS', '2', 'param', 'value']
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
        ['FT.AGGREGATE', 'index', '*', 'TIMEOUT', '10']
      );
    });
  });

  testUtils.testWithClient('client.ft.aggregate', async client => {
    await Promise.all([
      client.ft.create('index', {
        field: 'NUMERIC'
      }),
      client.hSet('1', 'field', '1'),
      client.hSet('2', 'field', '2')
    ]);

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
          Object.create(null, {
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
});
