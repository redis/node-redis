import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './MSET';

describe('MSET', () => {
    testUtils.isVersionGreaterThanHook([2, 6]);
    
    describe('transformArguments', () => {
        it('transformArguments', () => {
            assert.deepEqual(
                transformArguments([{ key: "key", path: "$", value: "json" }, { key: "key2", path: "$", value: "json2" }]),
                ['JSON.MSET', 'key', '$', '"json"', 'key2', '$', '"json2"']
            );
        });
    });


    testUtils.testWithClient('client.json.mSet', async client => {
        assert.equal(
            await client.json.mSet([{ key: "key", path: "$", value: "json" }, { key: "key2", path: "$", value: "json2" }]),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});