import TestUtils from '@redis/test-utils';
import RediSearch from '.';

export default new TestUtils({
    dockerImageName: 'redis',
    dockerImageVersionArgument: 'redisearch-version',
    defaultDockerVersion: '8.0-M01'
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
