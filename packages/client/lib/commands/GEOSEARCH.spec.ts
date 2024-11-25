import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEOSEARCH from './GEOSEARCH';
import { parseArgs } from './generic-transformers';

describe('GEOSEARCH', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('FROMMEMBER, BYRADIUS, without options', () => {
      assert.deepEqual(
        parseArgs(GEOSEARCH, 'key', 'member', {
          radius: 1,
          unit: 'm'
        }),
        ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm']
      );
    });

    it('FROMLONLAT, BYBOX, without options', () => {
      assert.deepEqual(
        parseArgs(GEOSEARCH, 'key', {
          longitude: 1,
          latitude: 2
        }, {
          width: 1,
          height: 2,
          unit: 'm'
        }),
        ['GEOSEARCH', 'key', 'FROMLONLAT', '1', '2', 'BYBOX', '1', '2', 'm']
      );
    });

    it('with SORT', () => {
      assert.deepEqual(
        parseArgs(GEOSEARCH, 'key', 'member', {
          radius: 1,
          unit: 'm'
        }, {
          SORT: 'ASC'
        }),
        ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'ASC']
      );
    });

    describe('with COUNT', () => {
      it('number', () => {
        assert.deepEqual(
          parseArgs(GEOSEARCH, 'key', 'member', {
            radius: 1,
            unit: 'm'
          }, {
            COUNT: 1
          }),
          ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'COUNT', '1']
        );
      });

      it('with ANY', () => {
        assert.deepEqual(
          parseArgs(GEOSEARCH, 'key', 'member', {
            radius: 1,
            unit: 'm'
          }, {
            COUNT: {
              value: 1,
              ANY: true
            }
          }),
          ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'COUNT', '1', 'ANY']
        );
      });
    });
  });

  testUtils.testAll('geoSearch', async client => {
    assert.deepEqual(
      await client.geoSearch('key', 'member', {
        radius: 1,
        unit: 'm'
      }),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
