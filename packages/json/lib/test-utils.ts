import TestUtils from '@redis/test-utils';
import RedisJSON from '.';

export default new TestUtils({
    dockerImageName: 'redislabs/rejson',
    dockerImageVersionArgument: 'rejson-version'
});

export const GLOBAL = {
    SERVERS: {
        OPEN: {
            serverArguments: ['--loadmodule /usr/lib/redis/modules/rejson.so'],
            clientOptions: {
                modules: {
                    json: RedisJSON
                }
            }
        }
    }
};
