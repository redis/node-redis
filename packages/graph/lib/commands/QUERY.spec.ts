import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './QUERY';

describe('QUERY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', '*', 100),
            ['GRAPH.QUERY', 'key', '*', '100']
        );
    });

    testUtils.testWithClient('client.graph.query', async client => {
        await client.graph.query('key',
			"CREATE (r:human {name:'roi', age:34}), (a:human {name:'amit', age:32}), (r)-[:knows]->(a)"
		);
        const reply = await client.graph.query('key',
			"MATCH (r:human)-[:knows]->(a:human) RETURN r.age, r.name"
		);
		assert.equal(reply.data.length, 1);
    }, GLOBAL.SERVERS.OPEN);
});
