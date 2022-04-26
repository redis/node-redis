import { strict as assert } from 'assert';
import testUtils from '../test-utils';
import { transformArguments } from './EVALSHA_RO';

describe('EVALSHA_RO', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('sha1', {
                keys: ['key'],
                arguments: ['argument']
            }),
            ['EVALSHA_RO', 'sha1', '1', 'key', 'argument']
        );
    });
});
