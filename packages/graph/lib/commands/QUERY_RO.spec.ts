import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './QUERY_RO';

describe('QUERY_RO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '*', 100),
            ['GRAPH.RO_QUERY', 'key', '*', '100']
        );
    });

    testUtils.testWithClient('client.graph.queryRo', async client => {
        await client.graph.query('key',
			"CREATE (r:human {name:'roi', age:34}), (a:human {name:'amit', age:32}), (r)-[:knows]->(a)"
		);
        const reply = await client.graph.queryRo('key',
			"MATCH (r:human)-[:knows]->(a:human) RETURN r.age, r.name"
		);
		assert.equal(reply.data.length, 1);
    }, GLOBAL.SERVERS.OPEN);
});