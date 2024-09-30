import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from './test-utils';
import Graph from './graph';

describe('Graph', () => {
    testUtils.testWithClient('null', async client => {
        const graph = new Graph(client as any, 'graph'),
            { data } = await graph.query('RETURN null AS key');

        assert.deepEqual(
            data,
            [{ key: null }]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('string', async client => {
        const graph = new Graph(client as any, 'graph'),
            { data } = await graph.query('RETURN "string" AS key');

        assert.deepEqual(
            data,
            [{ key: 'string' }]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('integer', async client => {
        const graph = new Graph(client as any, 'graph'),
            { data } = await graph.query('RETURN 0 AS key');

        assert.deepEqual(
            data,
            [{ key: 0 }]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('boolean', async client => {
        const graph = new Graph(client as any, 'graph'),
            { data } = await graph.query('RETURN false AS key');

        assert.deepEqual(
            data,
            [{ key: false }]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('double', async client => {
        const graph = new Graph(client as any, 'graph'),
            { data } = await graph.query('RETURN 0.1 AS key');

        assert.deepEqual(
            data,
            [{ key: 0.1 }]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('array', async client => {
        const graph = new Graph(client as any, 'graph'),
            { data } = await graph.query('RETURN [null] AS key');

        assert.deepEqual(
            data,
            [{ key: [null] }]
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('edge', async client => {
        const graph = new Graph(client as any, 'graph');

        // check with and without metadata cache
        for (let i = 0; i < 2; i++) {
            const { data } = await graph.query<any>('CREATE ()-[edge :edge]->() RETURN edge');
            assert.ok(Array.isArray(data));
            assert.equal(data.length, 1);
            assert.equal(typeof data[0].edge.id, 'number');
            assert.equal(data[0].edge.relationshipType, 'edge');
            assert.equal(typeof data[0].edge.sourceId, 'number');
            assert.equal(typeof data[0].edge.destinationId, 'number');
            assert.deepEqual(data[0].edge.properties, {});
        }

    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('node', async client => {
        const graph = new Graph(client as any, 'graph');

        // check with and without metadata cache
        for (let i = 0; i < 2; i++) {
            const { data } = await graph.query<any>('CREATE (node :node { p: 0 }) RETURN node');
            assert.ok(Array.isArray(data));
            assert.equal(data.length, 1);
            assert.equal(typeof data[0].node.id, 'number');
            assert.deepEqual(data[0].node.labels, ['node']);
            assert.deepEqual(data[0].node.properties, { p: 0 });
        }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('path', async client => {
        const graph = new Graph(client as any, 'graph'),
            [, { data }] = await Promise.all([
                await graph.query('CREATE ()-[:edge]->()'),
                await graph.roQuery<any>('MATCH path = ()-[:edge]->() RETURN path')
            ]);

        assert.ok(Array.isArray(data));
        assert.equal(data.length, 1);

        assert.ok(Array.isArray(data[0].path.nodes));
        assert.equal(data[0].path.nodes.length, 2);
        for (const node of data[0].path.nodes) {
            assert.equal(typeof node.id, 'number');
            assert.deepEqual(node.labels, []);
            assert.deepEqual(node.properties, {});
        }

        assert.ok(Array.isArray(data[0].path.edges));
        assert.equal(data[0].path.edges.length, 1);
        for (const edge of data[0].path.edges) {
            assert.equal(typeof edge.id, 'number');
            assert.equal(edge.relationshipType, 'edge');
            assert.equal(typeof edge.sourceId, 'number');
            assert.equal(typeof edge.destinationId, 'number');
            assert.deepEqual(edge.properties, {});
        }
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('map', async client => {
        const graph = new Graph(client as any, 'graph'),
            { data } = await graph.query('RETURN { key: "value" } AS map');

        assert.deepEqual(data, [{
            map: {
                key: 'value'
            }
        }]);
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('point', async client => {
        const graph = new Graph(client as any, 'graph'),
            { data } = await graph.query('RETURN point({ latitude: 1, longitude: 2 }) AS point');

        assert.deepEqual(data, [{
            point: {
                latitude: 1,
                longitude: 2
            }
        }]);
    }, GLOBAL.SERVERS.OPEN);
});
