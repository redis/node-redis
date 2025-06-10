import testUtils, { GLOBAL } from '../../test-utils';

describe('Cluster Request-Response Policies', () => {
	testUtils.testWithCluster('should resolve policies correctly', async cluster => {

		await cluster.get('foo')

	}, GLOBAL.CLUSTERS.OPEN);
});
