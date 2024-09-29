import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MSET';

describe('MSET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments([{
                key: '1',
                path: '$',
                value: 1
            }, {
                key: '2',
                path: '$',
                value: '2'
            }]),
            ['JSON.MSET', '1', '$', '1', '2', '$', '"2"']
        );
    });

    testUtils.testWithClient('client.json.mSet', async client => {
        assert.deepEqual(
            await client.json.mSet([{
                key: '1',
                path: '$',
                value: 1
            }, {
                key: '2',
                path: '$',
                value: '2'
            }]),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
