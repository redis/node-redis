import testUtils, { GLOBAL } from '../../test-utils';
import RediSearch from '@redis/search';

import RedisBloomModules from '@redis/bloom';
import RedisJSON from '@redis/json';
import RedisTimeSeries from '@redis/time-series';

describe('Cluster Request-Response Policies', () => {
	testUtils.testWithClient('should resolve policies correctly', async client => {
		await client.ft.SUGADD('index', 'string', 1);
		await client.ft.dictAdd('index', 'foo');
	}, {
		...GLOBAL.SERVERS.OPEN,
		clientOptions: {
			modules: {
			  ft: RediSearch
			}
		  }
	});

	testUtils.testWithCluster('should resolve policies correctly', async cluster => {

		await cluster.ft.SUGADD('index', 'string', 1);
		await cluster.ft.DICTADD('index', 'foo');
		await cluster.sendCommand(undefined, true, ['ft.dictadd', 'index', 'string']);
		
	}, {
		...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        modules: {
			ft: RediSearch,
        //   ...RedisBloomModules,
        //   json: RedisJSON,
        //   ts: RedisTimeSeries
        },
      }
	});
});
