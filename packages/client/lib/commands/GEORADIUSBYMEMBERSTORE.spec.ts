import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './GEORADIUSBYMEMBERSTORE';

describe('GEORADIUSBYMEMBERSTORE', () => {
    describe('transformArguments', () => {
        it('STORE', () => {
            assert.deepEqual(
                transformArguments('key', 'member', 3 , 'm', 'dest', {
                    SORT: 'ASC',
                    COUNT: {
                        value: 1,
                        ANY: true
                    }
                }),
                ['GEORADIUSBYMEMBER', 'key', 'member', '3', 'm', 'ASC', 'COUNT', '1', 'ANY', 'STORE', 'dest']
            );
        });

        it('STOREDIST', () => {
            assert.deepEqual(
                transformArguments('key', 'member', 3 , 'm', 'dest', { STOREDIST: true }),
                ['GEORADIUSBYMEMBER', 'key', 'member', '3', 'm', 'STOREDIST', 'dest']
            );
        });
    });

    testUtils.testWithClient('client.geoRadiusByMemberStore', async client => {
        await client.geoAdd('source', {
            longitude: 1,
            latitude: 1,
            member: 'member'
        });

        assert.equal(
            await client.geoRadiusByMemberStore('source', 'member', 3 , 'm', 'dest'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithCluster('cluster.geoRadiusByMemberStore', async cluster => {
        await cluster.geoAdd('{tag}source', {
            longitude: 1,
            latitude: 1,
            member: 'member'
        });

        assert.equal(
            await cluster.geoRadiusByMemberStore('{tag}source', 'member', 3 , 'm','{tag}destination'),
            1
        );
    }, GLOBAL.CLUSTERS.OPEN);
});
