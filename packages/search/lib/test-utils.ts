import TestUtils from '@redis/test-utils';
import RediSearch from '.';

export default new TestUtils({
    dockerImageName: 'redis/redis-stack',
    dockerImageVersionArgument: 'redisearch-version',
    defaultDockerVersion: '7.4.0-v1'
});

export const GLOBAL = {
    SERVERS: {
        OPEN: {
            serverArguments: [],
            clientOptions: {
                modules: {
                    ft: RediSearch
                }
            }
        }
    }
};
