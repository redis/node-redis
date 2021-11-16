import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './XINFO_STREAM';

describe('XINFO STREAM', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key'),
            ['XINFO', 'STREAM', 'key']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply([
                'length', 2,
                'radix-tree-keys', 1,
                'radix-tree-nodes', 2,
                'last-generated-id', '1538385846314-0',
                'groups', 2,
                'first-entry', ['1538385820729-0', ['foo', 'bar']],
                'last-entry', ['1538385846314-0', ['field', 'value']]
            ]),
            {
                length: 2,
                radixTreeKeys: 1,
                radixTreeNodes: 2,
                groups: 2,
                lastGeneratedId: '1538385846314-0',
                firstEntry: {
                    id: '1538385820729-0',
                    message: Object.create(null, {
                        foo: {
                            value: 'bar',
                            configurable: true,
                            enumerable: true
                        }
                    })
                },
                lastEntry: {
                    id: '1538385846314-0',
                    message: Object.create(null, {
                        field: {
                            value: 'value',
                            configurable: true,
                            enumerable: true
                        }
                    })
                }
            }
        );
    });

    testUtils.testWithClient('client.xInfoStream', async client => {
        await client.xGroupCreate('key', 'group', '$', {
            MKSTREAM: true
        });

        assert.deepEqual(
            await client.xInfoStream('key'),
            {
                length: 0,
                radixTreeKeys: 0,
                radixTreeNodes: 1,
                groups: 1,
                lastGeneratedId: '0-0',
                firstEntry: null,
                lastEntry: null
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
