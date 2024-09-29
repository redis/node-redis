import TestUtils from '@redis/test-utils';
import RedisGraph from '.';

export default new TestUtils({
    dockerImageName: 'redislabs/redisgraph',
    dockerImageVersionArgument: 'redisgraph-version'
});

export const GLOBAL = {
    SERVERS: {
        OPEN: {
            serverArguments: ['--loadmodule /usr/lib/redis/modules/redisgraph.so'],
            clientOptions: {
                modules: {
                    graph: RedisGraph
                }
            }
        }
    }
};
