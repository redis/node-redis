import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CONFIG_SET';

describe('CONFIG SET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('TIMEOUT', '500'),
            ['FT.CONFIG', 'SET', 'TIMEOUT', '500']
        );
    });
});
