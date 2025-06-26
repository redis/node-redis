import testUtils, { GLOBAL } from '../../test-utils';
import RediSearch from '@redis/search';

import RedisBloomModules from '@redis/bloom';
import RedisJSON from '@redis/json';
import RedisTimeSeries from '@redis/time-series';

describe('Cluster Request-Response Policies', () => {

	testUtils.testWithCluster('should resolve policies correctly', async cluster => {

		await cluster.ft.SUGADD('index', 'string', 1);
		
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
